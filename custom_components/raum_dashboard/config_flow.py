"""Einrichtung über Einstellungen › Geräte & Dienste: nur bestätigen. Darstellung unter „Konfigurieren“."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import NumberSelector, NumberSelectorConfig, NumberSelectorMode

from .const import DOMAIN, OPT_GLOW, OPT_MOEBEL, STANDARD_PROZENT

REGLER = NumberSelector(
    NumberSelectorConfig(min=0, max=100, step=5, unit_of_measurement="%", mode=NumberSelectorMode.SLIDER)
)


class RaumDashboardFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return RaumDashboardOptionen()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="Raum-Dashboard", data={})
        return self.async_show_form(step_id="user")


class RaumDashboardOptionen(OptionsFlow):
    """Darstellung: wie durchsichtig die Möbel sind und wie stark die Kanten leuchten."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(
                data={OPT_MOEBEL: int(user_input[OPT_MOEBEL]), OPT_GLOW: int(user_input[OPT_GLOW])}
            )
        o = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Required(OPT_MOEBEL, default=o.get(OPT_MOEBEL, STANDARD_PROZENT)): REGLER,
                vol.Required(OPT_GLOW, default=o.get(OPT_GLOW, STANDARD_PROZENT)): REGLER,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
