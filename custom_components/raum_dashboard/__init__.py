"""Raum-Dashboard: 3D-Ansicht der Räume als Seite in der Seitenleiste.

Die Dateien liegen in frontend/. Diese Integration stellt sie bereit und meldet das Panel an.
In die configuration.yaml muss nichts. Die Seite liest und schaltet nur über das Home-Assistant-Frontend,
mit den Rechten des angemeldeten Benutzers. Eigene Punkte im Plan speichert punkte.py in Home Assistant.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PANEL_PFAD, URL_BASIS
from .punkte import async_registrieren

_LOGGER = logging.getLogger(__name__)

ORDNER = Path(__file__).parent / "frontend"


def _version() -> str:
    try:
        return json.loads((Path(__file__).parent / "manifest.json").read_text())["version"]
    except (OSError, ValueError, KeyError):
        return "0"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    daten = hass.data.setdefault(DOMAIN, {})
    if not daten.get("pfad"):
        await hass.http.async_register_static_paths([StaticPathConfig(URL_BASIS, str(ORDNER), False)])
        daten["pfad"] = True

    async_registrieren(hass)
    version = await hass.async_add_executor_job(_version)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PFAD,
        webcomponent_name="raum-dashboard-panel",
        sidebar_title="Räume",
        sidebar_icon="mdi:cube-scan",
        module_url=f"{URL_BASIS}/raum-dashboard.js?v={version}",
        require_admin=False,
        config={"basis": URL_BASIS, "version": version},
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_PFAD, warn_if_unknown=False)
    return True
