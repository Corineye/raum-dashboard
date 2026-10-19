"""Eigene Punkte und Szenen im 3D-Plan: gespeichert in Home Assistant (.storage/raum_dashboard.punkte).

Ein Punkt verbindet eine Stelle in der Wohnung mit einer Entität. Eine Szene merkt sich, welche Punkte an und aus sind.
Das Panel liest beides beim Öffnen und speichert es nach jeder Änderung als Ganzes zurück.
Speichern dürfen nur Administratoren.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import DOMAIN

SPEICHER_VERSION = 1
SPEICHER_SCHLUESSEL = f"{DOMAIN}.punkte"
EREIGNIS = f"{DOMAIN}_punkte"
MAX_PUNKTE = 500
MAX_SZENEN = 30

PUNKT = vol.Schema(
    {
        vol.Optional("raum"): vol.Any(None, vol.All(str, vol.Length(max=20))),
        vol.Optional("x"): vol.Coerce(float),
        vol.Optional("y"): vol.Coerce(float),
        vol.Optional("z"): vol.Coerce(float),
        vol.Optional("entity_id"): vol.Any(None, vol.All(str, vol.Length(max=255))),
        vol.Optional("name"): vol.Any(None, vol.All(str, vol.Length(max=80))),
        vol.Optional("symbol"): vol.Any(None, vol.All(str, vol.Length(max=20))),
        vol.Optional("geloescht"): bool,
    },
    extra=vol.REMOVE_EXTRA,
)

ID = vol.All(str, vol.Length(min=1, max=40))
SZENE = vol.Schema(
    {
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=40)),
        vol.Required("an"): vol.All([ID], vol.Length(max=MAX_PUNKTE)),
        vol.Required("aus"): vol.All([ID], vol.Length(max=MAX_PUNKTE)),
    },
    extra=vol.REMOVE_EXTRA,
)


def _speicher(hass: HomeAssistant) -> Store:
    daten = hass.data.setdefault(DOMAIN, {})
    if "speicher" not in daten:
        daten["speicher"] = Store(hass, SPEICHER_VERSION, SPEICHER_SCHLUESSEL)
    return daten["speicher"]


@callback
def async_registrieren(hass: HomeAssistant) -> None:
    """Websocket-Befehle einmalig anmelden."""
    daten = hass.data.setdefault(DOMAIN, {})
    if daten.get("ws"):
        return
    websocket_api.async_register_command(hass, ws_lesen)
    websocket_api.async_register_command(hass, ws_speichern)
    daten["ws"] = True


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/punkte"})
@websocket_api.async_response
async def ws_lesen(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    gespeichert = await _speicher(hass).async_load() or {}
    connection.send_result(
        msg["id"], {"punkte": gespeichert.get("punkte", {}), "szenen": gespeichert.get("szenen", {})}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/punkte/speichern",
        vol.Optional("punkte"): vol.All({ID: PUNKT}, vol.Length(max=MAX_PUNKTE)),
        vol.Optional("szenen"): vol.All({ID: SZENE}, vol.Length(max=MAX_SZENEN)),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_speichern(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    speicher = _speicher(hass)
    alt = await speicher.async_load() or {}
    await speicher.async_save(
        {
            "punkte": msg.get("punkte", alt.get("punkte", {})),
            "szenen": msg.get("szenen", alt.get("szenen", {})),
        }
    )
    hass.bus.async_fire(EREIGNIS)
    connection.send_result(msg["id"], {"ok": True})
