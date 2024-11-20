import { LitElement, html } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import { getDefaultConfig } from '../config/default-config.js';

export class OctopusEnergyRatesCardEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            _config: { type: Object },
        };
    }

    setConfig(config) {
        this._config = {
            ...getDefaultConfig(),
            ...config,
            targetTimes: config.targetTimes || [],
            colorThresholds: config.colorThresholds || []
        };
    }

    render() {
        if (!this.hass || !this._config) return html``;

        return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._getSchema()}
        .computeLabel=${(schema) => schema.label || schema.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
    }

    _getSchema() {
        return [
            { name: "title", label: "Card Title", selector: { text: {} } },
            {
                type: "expandable",
                name: "entities",
                title: "Entities",
                icon: "mdi:lightning-bolt",
                schema: [
                    {
                        name: "current",
                        label: "Current Rates Entity",
                        selector: { entity: { filter: { domain: "event" } } },
                        required: true,
                    },
                    {
                        name: "past",
                        label: "Past Rates Entity",
                        selector: { entity: { filter: { domain: "event" } } },
                    },
                    {
                        name: "future",
                        label: "Future Rates Entity",
                        selector: { entity: { filter: { domain: "event" } } },
                    },
                ],
            },
            {
                type: "expandable",
                name: "display",
                title: "Display Options",
                icon: "mdi:eye",
                schema: [
                    {
                        type: "grid",
                        columns: 2,
                        schema: [
                            {
                                name: "cols",
                                label: "Columns",
                                selector: { number: { min: 1, max: 3 } },
                            },
                            {
                                name: "roundUnits",
                                label: "Decimal places",
                                selector: { number: { min: 0, max: 3, mode: "slider" } },
                            },
                        ],
                    },
                    {
                        type: "grid",
                        columns: 3,
                        schema: [
                            {
                                name: "showpast",
                                label: "Show Past",
                                selector: { boolean: {} },
                            },
                            {
                                name: "showday",
                                label: "Day Label",
                                selector: { boolean: {} },
                            },
                            {
                                name: "hour12",
                                label: "12hr Time?",
                                selector: { boolean: {} },
                            },
                        ],
                    },
                ],
            },
            {
                type: "expandable",
                name: "colorThresholds",
                title: "Color Thresholds",
                icon: "mdi:palette",
                schema: [
                    {
                        type: "grid",
                        columns: 2,
                        schema: (this._config.colorThresholds || []).map((_, index) => [
                            {
                                name: `colorThresholds.${index}.value`,
                                label: "Threshold Value",
                                selector: { number: { mode: "box" } },
                            },
                            {
                                name: `colorThresholds.${index}.color`,
                                label: "Color",
                                selector: { color_rgb: {} },
                            },
                        ]).flat(),
                    },
                    {
                        type: "button",
                        name: "add_color_threshold",
                        label: "Add Color Threshold",
                        action: "add_color_threshold",
                    },
                ],
            },
            {
                type: "expandable",
                name: "targetTimes",
                title: "Target Times",
                icon: "mdi:clock-outline",
                schema: [
                    ...(this._config.targetTimes || []).map((_, index) => ({
                        type: "grid",
                        columns: 3,
                        schema: [
                            {
                                name: `targetTimes.${index}.entity`,
                                label: "Entity",
                                selector: { entity: { filter: { domain: "binary_sensor" } } },
                            },
                            {
                                name: `targetTimes.${index}.backgroundColor`,
                                label: "Background Color",
                                selector: { color_rgb: {} },
                            },
                            {
                                name: `targetTimes.${index}.prefix`,
                                label: "Icon",
                                selector: { icon: {} },
                            },
                        ],
                    })),
                    {
                        type: "button",
                        name: "add_target_time",
                        label: "Add Target Time",
                        action: "add_target_time",
                    },
                ],
            },
        ];
    }

    _valueChanged(ev) {
        if (ev.detail.value) {
            const newConfig = { ...this._config };

            if (ev.detail.value.add_color_threshold === "add_color_threshold") {
                newConfig.colorThresholds = [...(newConfig.colorThresholds || []), { value: 0, color: "#000000" }];
            } else if (ev.detail.value.add_target_time === "add_target_time") {
                newConfig.targetTimes = [...(newConfig.targetTimes || []), { entity: "", backgroundColor: "", prefix: "" }];
            } else {
                Object.assign(newConfig, ev.detail.value);
                newConfig.colorThresholds = this._updateNestedArray(newConfig.colorThresholds, ev.detail.value, 'colorThresholds');
                newConfig.targetTimes = this._updateNestedArray(newConfig.targetTimes, ev.detail.value, 'targetTimes');
            }

            this._config = newConfig;
            this.requestUpdate();
        }

        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
        }));
    }

    _updateNestedArray(array, changes, prefix) {
        if (!Array.isArray(array)) return [];
        return array.map((item, index) => {
            const updatedItem = { ...item };
            Object.keys(changes).forEach(key => {
                if (key.startsWith(`${prefix}.${index}.`)) {
                    const property = key.split('.')[2];
                    updatedItem[property] = changes[key];
                }
            });
            return updatedItem;
        });
    }
}