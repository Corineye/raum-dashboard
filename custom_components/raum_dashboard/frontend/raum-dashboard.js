// Panel „Räume“: bettet die 3D-Wohnung ein, schickt ihr Geräteliste, Zustände und gespeicherte Punkte
// aus Home Assistant und führt Schaltwünsche aus. Punkte speichert die Integration (punkte.py).
const SCHALTBAR = ["light", "switch", "fan", "input_boolean"];
const DOMAIN = "raum_dashboard";

class RaumDashboardPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._bereit = false;
    this._zuletzt = "";
    this._anzahl = -1;
    this._gewollt = [];
    this._onMsg = (ev) => this._nachricht(ev);
  }

  set hass(h) {
    this._hass = h;
    this._senden();
  }

  set panel(p) {
    this._konf = (p && p.config) || {};
  }

  set narrow(n) {
    this._narrow = n;
    if (this._menu) this._menu.style.display = n ? "" : "none";
  }

  connectedCallback() {
    if (this._rahmen) return;
    const basis = (this._konf && this._konf.basis) || "/raum_dashboard_dateien";
    const v = (this._konf && this._konf.version) || "0";
    // Feste Höhe statt 100 %: hängt nicht davon ab, wie hoch Home Assistant den Panel-Rahmen macht
    this.style.cssText = "display:block;position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#0b1111";
    const rahmen = document.createElement("iframe");
    rahmen.src = `${basis}/wohnung.html?v=${v}${this._narrow ? "&schmal=1" : ""}`;
    rahmen.title = "3D-Wohnung";
    rahmen.style.cssText = "border:0;position:absolute;left:0;top:0;width:100%;height:100%;display:block";
    this.appendChild(rahmen);
    const menu = document.createElement("button");
    menu.textContent = "☰";
    menu.setAttribute("aria-label", "Menü");
    menu.style.cssText =
      "position:absolute;left:8px;top:8px;z-index:2;width:40px;height:40px;border-radius:12px;border:1px solid #2a3a38;background:#101a19cc;color:#cfeee6;font-size:20px;cursor:pointer;display:" +
      (this._narrow ? "" : "none");
    menu.onclick = () => this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
    this.appendChild(menu);
    this._menu = menu;
    this._rahmen = rahmen;
    window.addEventListener("message", this._onMsg);
  }

  disconnectedCallback() {
    window.removeEventListener("message", this._onMsg);
    if (this._abo) this._abo.then((ab) => ab()).catch(() => {});
    this._abo = null;
    this._rahmen = null;
    this._bereit = false;
  }

  _post(m) {
    if (this._rahmen && this._rahmen.contentWindow) this._rahmen.contentWindow.postMessage(m, "*");
  }

  // Geräteliste für die Auswahl beim Setzen eines Punkts; nur neu schicken, wenn Entitäten dazukommen oder wegfallen
  _geraete() {
    const h = this._hass;
    const ids = Object.keys(h.states);
    if (ids.length === this._anzahl) return;
    this._anzahl = ids.length;
    const list = ids
      .map((id) => {
        const a = h.states[id].attributes || {};
        return { id, n: a.friendly_name || id, dc: a.device_class || null };
      })
      .sort((x, y) => x.n.localeCompare(y.n, "de"));
    this._post({ type: "raum-entities", list });
  }

  // Zustände nur für die Geräte, die im Plan als Punkt vorkommen
  _zustaende() {
    const h = this._hass;
    const v = {};
    for (const id of this._gewollt) {
      const s = h.states[id];
      if (!s) continue;
      const a = s.attributes || {};
      const o = { s: s.state, n: a.friendly_name || id, u: a.unit_of_measurement || null, dc: a.device_class || null, lc: Date.parse(s.last_changed) || 0 };
      if (SCHALTBAR.includes(id.split(".")[0])) o.on = s.state === "on";
      if (id.startsWith("climate.")) Object.assign(o, { ist: a.current_temperature, soll: a.temperature, aktion: a.hvac_action || null });
      v[id] = o;
    }
    return v;
  }

  _senden() {
    if (!this._bereit || !this._hass) return;
    this._geraete();
    this._himmel();
    const v = this._zustaende();
    const text = JSON.stringify(v);
    if (text === this._zuletzt) return;
    this._zuletzt = text;
    this._post({ type: "raum-states", v });
  }

  // Sonnenstand (sun.sun) und Wetter (erste weather-Entität) für den Himmel im Plan
  _himmel() {
    const h = this._hass;
    const sun = h.states["sun.sun"];
    const wid = Object.keys(h.states).filter((id) => id.startsWith("weather.")).sort()[0];
    const w = wid ? h.states[wid] : null;
    const himmel = {
      sonne: sun && sun.attributes && sun.attributes.elevation != null ? { el: sun.attributes.elevation, az: sun.attributes.azimuth } : null,
      wetter: w ? { zustand: w.state, temp: w.attributes.temperature != null ? w.attributes.temperature : null, einheit: w.attributes.temperature_unit || "°C" } : null,
    };
    const text = JSON.stringify(himmel);
    if (text === this._himmelText) return;
    this._himmelText = text;
    this._post({ type: "raum-sky", himmel });
  }

  async _punkteLaden() {
    try {
      const r = await this._hass.callWS({ type: `${DOMAIN}/punkte` });
      this._post({ type: "raum-punkte", punkte: r.punkte || {}, szenen: r.szenen || {} });
    } catch (e) {
      this._post({ type: "raum-fehler", text: "Punkte konnten nicht geladen werden. Ist die Integration aktuell und Home Assistant neu gestartet?" });
    }
  }

  async _punkteSpeichern(daten) {
    try {
      await this._hass.callWS({ type: `${DOMAIN}/punkte/speichern`, ...daten });
    } catch (e) {
      this._post({ type: "raum-fehler", text: "Speichern hat nicht geklappt: " + ((e && e.message) || "unbekannter Fehler") });
      this._punkteLaden();
    }
  }

  _nachricht(ev) {
    if (!this._rahmen || ev.source !== this._rahmen.contentWindow) return;
    const m = ev.data;
    if (!m || !this._hass) return;
    if (m.type === "raum-ready") {
      this._bereit = true;
      this._zuletzt = "";
      this._anzahl = -1;
      this._himmelText = "";
      const admin = !!(this._hass.user && this._hass.user.is_admin);
      this._post({ type: "raum-init", admin, darstellung: (this._konf && this._konf.darstellung) || null });
      this._senden();
      this._punkteLaden();
      // Änderungen von einem anderen Gerät sofort übernehmen (nur für Administratoren abonnierbar)
      if (admin && !this._abo) {
        this._abo = this._hass.connection.subscribeEvents(() => this._punkteLaden(), `${DOMAIN}_punkte`);
        this._abo.catch(() => {
          this._abo = null;
        });
      }
    } else if (m.type === "raum-want") {
      this._gewollt = Array.isArray(m.ids) ? m.ids.filter((x) => typeof x === "string") : [];
      this._zuletzt = "";
      this._senden();
    } else if (m.type === "raum-call") {
      this._schalten(m);
    } else if (m.type === "raum-save" && ((m.punkte && typeof m.punkte === "object") || (m.szenen && typeof m.szenen === "object"))) {
      const daten = {};
      if (m.punkte && typeof m.punkte === "object") daten.punkte = m.punkte;
      if (m.szenen && typeof m.szenen === "object") daten.szenen = m.szenen;
      this._punkteSpeichern(daten);
    }
  }

  // Nur an/aus für Lampen, Schalter, Lüfter und Ein/Aus-Helfer, die als Punkt im Plan stehen
  _schalten(m) {
    const ids = (Array.isArray(m.ids) ? m.ids : []).filter(
      (id) => typeof id === "string" && this._gewollt.includes(id) && SCHALTBAR.includes(id.split(".")[0]) && this._hass.states[id]
    );
    if (!ids.length) return;
    this._hass.callService("homeassistant", m.on ? "turn_on" : "turn_off", { entity_id: ids });
  }
}

if (!customElements.get("raum-dashboard-panel")) customElements.define("raum-dashboard-panel", RaumDashboardPanel);
