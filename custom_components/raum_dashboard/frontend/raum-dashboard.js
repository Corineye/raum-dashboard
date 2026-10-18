// Panel „Räume“: bettet die 3D-Seite ein, schickt ihr die Zustände aus Home Assistant
// und führt Schaltwünsche für die Lampen aus. Gerätenamen wie in Home Assistant.
const NAMEN = {
  deck: "Deckenlicht Arbeitszimmer",
  piano: "Ikea E14 22",
  iris: "Iris Leuchte Arbeitszimmer",
  desk: "Schreibtischlampe",
  luftT: "Luft-Sensor Arbeitszimmer Temperatur",
  luftH: "Luft-Sensor Arbeitszimmer Luftfeuchtigkeit",
  fenster: "Fenster Arbeitzimmer",
  heizung: "Heizung Arbeitszimmer",
  robi: "Robi",
  robiDose: "Steckdose Robi",
  druckerDose: "3d-Drucker",
  druckerWatt: "3d-Drucker Derzeitiger Verbrauch",
  druckerMonat: "3d-Drucker Der Verbrauch dieses Monats",
  p1s: "3D-Drucker P1S Online",
};
const ROBI = { docked: "in der Station", cleaning: "saugt", returning: "fährt zurück", paused: "pausiert", idle: "wartet", error: "Fehler" };
const FARBFAEHIG = ["hs", "xy", "rgb", "rgbw", "rgbww"];

const hex = (rgb) => "#" + rgb.map((x) => Math.max(0, Math.min(255, x | 0)).toString(16).padStart(2, "0")).join("");
const rgbAus = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

class RaumDashboardPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._bereit = false;
    this._zuletzt = "";
    this._ids = {};
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
    rahmen.src = `${basis}/arbeitszimmer.html?v=${v}${this._narrow ? "&schmal=1" : ""}`;
    rahmen.title = "3D-Arbeitszimmer";
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
    this._rahmen = null;
    this._bereit = false;
  }

  // Entität zu einem Anzeigenamen finden (Namen wie in Home Assistant, Groß-/Kleinschreibung egal)
  _finde(schluessel) {
    const h = this._hass;
    if (!h) return null;
    const id = this._ids[schluessel];
    if (id && h.states[id]) return h.states[id];
    const ziel = NAMEN[schluessel].toLowerCase();
    for (const [eid, s] of Object.entries(h.states)) {
      if (((s.attributes && s.attributes.friendly_name) || "").toLowerCase() === ziel) {
        this._ids[schluessel] = eid;
        return s;
      }
    }
    return null;
  }

  _lampe(schluessel) {
    const s = this._finde(schluessel);
    if (!s || s.state === "unavailable" || s.state === "unknown") return null;
    const a = s.attributes || {};
    const o = { on: s.state === "on" };
    if (a.brightness != null) o.pct = Math.round((a.brightness / 255) * 100);
    if (Array.isArray(a.rgb_color)) o.color = hex(a.rgb_color);
    return o;
  }

  _zustaende() {
    const num = (k) => {
      const s = this._finde(k);
      const x = s ? parseFloat(s.state) : NaN;
      return Number.isNaN(x) ? null : x;
    };
    const v = {};
    for (const k of ["deck", "piano", "iris", "desk"]) {
      const l = this._lampe(k);
      if (l) v[k] = l;
    }
    const t = num("luftT"), f = num("luftH");
    if (t != null || f != null) v.luft = { t, h: f };
    const fe = this._finde("fenster");
    if (fe && fe.state !== "unavailable") v.fenster = { offen: fe.state === "on" };
    const he = this._finde("heizung");
    if (he && he.state !== "unavailable") {
      const a = he.attributes || {};
      v.heizung = { modus: he.state === "heat" ? "heizt" : he.state === "off" ? "ist aus" : he.state, ist: a.current_temperature, soll: a.temperature, aktion: a.hvac_action || null };
    }
    const ro = this._finde("robi"), rd = this._finde("robiDose");
    if (ro) v.robi = { status: ROBI[ro.state] || ro.state, steckdose: rd ? rd.state === "on" : false };
    const dd = this._finde("druckerDose");
    if (dd) {
      const p = this._finde("p1s");
      v.drucker = {
        steckdose: dd.state === "on",
        watt: num("druckerWatt") || 0,
        monat: num("druckerMonat"),
        p1s: p && p.state === "on" ? "online" : "nicht erreichbar",
      };
    }
    return v;
  }

  _senden() {
    if (!this._bereit || !this._rahmen || !this._rahmen.contentWindow) return;
    const v = this._zustaende();
    const text = JSON.stringify(v);
    if (text === this._zuletzt) return;
    this._zuletzt = text;
    this._rahmen.contentWindow.postMessage({ type: "raum-states", v }, "*");
  }

  _nachricht(ev) {
    if (!this._rahmen || ev.source !== this._rahmen.contentWindow) return;
    const m = ev.data;
    if (!m) return;
    if (m.type === "raum-ready") {
      this._bereit = true;
      this._zuletzt = "";
      this._senden();
    } else if (m.type === "raum-call") {
      this._schalten(m);
    }
  }

  // Nur Lampen: an/aus, Helligkeit und (falls die Lampe es kann) Farbe
  _schalten(m) {
    const s = this._finde(m.id);
    if (!s || !s.entity_id.startsWith("light.")) return;
    if (!m.on) {
      this._hass.callService("light", "turn_off", { entity_id: s.entity_id });
      return;
    }
    const a = s.attributes || {};
    const modi = a.supported_color_modes || [];
    const daten = { entity_id: s.entity_id };
    if (modi.some((x) => x !== "onoff") && m.pct != null) daten.brightness_pct = Math.max(1, Math.min(100, m.pct));
    if (modi.some((x) => FARBFAEHIG.includes(x)) && m.color) daten.rgb_color = rgbAus(m.color);
    this._hass.callService("light", "turn_on", daten);
  }
}

if (!customElements.get("raum-dashboard-panel")) customElements.define("raum-dashboard-panel", RaumDashboardPanel);
