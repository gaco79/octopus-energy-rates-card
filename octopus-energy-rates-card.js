import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import './mgc_list.js';


class OctopusEnergyRatesCard extends LitElement {
  static get properties() {
    return {
      _config: { type: Object },
      hass: { type: Object },
    };
  }

  constructor() {
    super();
    this._config = {};
  }

  setConfig(config) {
    if (!config.entities || !config.entities.current) {
      throw new Error("You need to define a current entity");
    }
    this._config = {
      ...OctopusEnergyRatesCard.getDefaultConfig(),
      ...config,
      colorThresholds: config.colorThresholds || []
    };
  }

  static getDefaultConfig() {
    return {
      title: "Octopus Energy Rates",
      entities: {
        current: "",
        past: "",
        future: "",
      },
      display: {
        cols: 1,
        showpast: false,
        showday: true,
        hour12: true,
        roundUnits: 2,
        unitstr: "",
        multiplier: 100,
      },
      colorThresholds: [
        { value: 0, color: "#391CD9" },
        { value: 15, color: "#4CAF50" },
        { value: 25, color: "#FFA500" },
        { value: 35, color: "#FF6347" },
      ],
      targetTimes: [],
    };
  }

  static getStubConfig() {
    return {
      title: "Octopus Energy Rates",
      entities: {
        current: "",
        past: "",
        future: "",
      },
      display: {
        cols: 1,
        showpast: false,
        showday: false,
        hour12: false,
        roundUnits: 1,
        unitstr: "",
        multiplier: 100,
      },
      colorThresholds: [
        { value: 0, color: "#391CD9" },
        { value: 15, color: "#4CAF50" },
        { value: 25, color: "#FFA500" },
        { value: 35, color: "#FF6347" },
      ],
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }
      .card-content {
        padding: 0 16px 16px;
      }
      .rate-columns {
        display: flex;
        justify-content: space-between;
      }
      .rate-column {
        flex: 1;
        padding: 0 4px;
      }
      table {
        width: 100%;
        border-spacing: 0 1px;
        border-collapse: separate;
      }
      td {
        padding: 4px;
        text-align: center;
        border-bottom-width: 1px;
        border-bottom-style: solid;
      }
      .rate {
        color: white;
        border-radius: 0 15px 15px 0;
      }
    `;
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    const { current, past, future } = this._config.entities;
    const currentStateObj = this.hass.states[current];
    const pastStateObj = past ? this.hass.states[past] : null;
    const futureStateObj = future ? this.hass.states[future] : null;

    if (!currentStateObj) {
      return html`
        <ha-card header="${this._config.title}">
          <div class="card-content">Current entity not found: ${current}</div>
        </ha-card>
      `;
    }

    const currentRates = this.getRatesFromStateObj(currentStateObj);
    const pastRates = pastStateObj
      ? this.getRatesFromStateObj(pastStateObj)
      : [];
    const futureRates = futureStateObj
      ? this.getRatesFromStateObj(futureStateObj)
      : [];

    const allRates = [...pastRates, ...currentRates, ...futureRates];
    const filteredRates = this.getFilteredRates(allRates);
    const columns = this.splitIntoColumns(filteredRates);

    return html`
      <ha-card header="${this._config.title}">
        <div class="card-content">
          <div class="rate-columns">
            ${columns.map((column) => this.renderColumn(column))}
          </div>
        </div>
      </ha-card>
    `;
  }

  getRatesFromStateObj(stateObj) {
    if (stateObj.attributes && Array.isArray(stateObj.attributes.rates)) {
      return stateObj.attributes.rates;
    } else if (
      stateObj.attributes &&
      typeof stateObj.attributes.rates === "object"
    ) {
      // Handle case where rates might be an object instead of an array
      return Object.values(stateObj.attributes.rates);
    }
    return [];
  }

  getFilteredRates(rates) {
    const { showpast } = this._config.display;
    const now = new Date();
    return rates
      .filter((rate) => {
        const rateDate = new Date(rate.start);
        return showpast || rateDate > now;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort rates by start time
  }

  splitIntoColumns(rates) {
    const cols = this._config.display.cols || 1;
    const columns = Array.from({ length: cols }, () => []);
    rates.forEach((rate, index) => {
      columns[index % cols].push(rate);
    });
    return columns;
  }

  renderColumn(rates) {
    return html`
      <div class="rate-column">
        <table>
          ${rates.map((rate) => this.renderRateRow(rate))}
        </table>
      </div>
    `;
  }

  renderRateRow(rate) {
    const { hour12, showday, unitstr, roundUnits, multiplier } =
      this._config.display;

    const startDate = new Date(rate.start);
    const endDate = new Date(rate.end);

    const formattedTime = startDate.toLocaleTimeString(navigator.language, {
      hour: "numeric",
      minute: "2-digit",
      hour12,
    });

    const formattedDay = showday
      ? startDate.toLocaleDateString(navigator.language, { weekday: "short" }) +
      " "
      : "";
    const rateValue = (rate.value_inc_vat * multiplier).toFixed(roundUnits);

    const color = this.getRateColor(rate.value_inc_vat);
    const color_string = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    const targetTime = this.getTargetTime(startDate, endDate);

    const style = `background-color: ${color_string}; border-color: ${color_string};`;

    const prefix = targetTime ? targetTime.prefix : "";

    return html`
      <tr>
        <td
          style="border-image: linear-gradient(to right, var(--card-background-color) 20%, ${color_string} 100%) 1; text-align:right; padding-right:1rem;"
        >
          ${prefix ? html`<ha-icon icon="${prefix}"></ha-icon>` : ""}
          ${formattedDay}${formattedTime}
        </td>
        <td class="rate" style="${style}">${rateValue}${unitstr}</td>
      </tr>
    `;
  }

  getTargetTime(start, end) {
    for (const tt of this._config.targetTimes) {
      const entityState = this.hass.states[tt.entity];

      if (entityState && entityState.attributes.target_times) {
        const targetTimes = entityState.attributes.target_times;

        for (const targetTime of targetTimes) {
          const targetStart = new Date(targetTime.start);
          const targetEnd = new Date(targetTime.end);

          if (start >= targetStart && end <= targetEnd) {
            return {
              backgroundColor: tt.backgroundColor,
              prefix: tt.prefix,
            };
          }
        }
      }
    }
    return null;
  }

  getRateColor(rate) {
    if (!this._config.colorThresholds || this._config.colorThresholds.length === 0) {
      return "#000000"; // Default color if no thresholds are defined
    }

    // Create a copy of the colorThresholds array to avoid modifying the original
    const sortedThresholds = [...this._config.colorThresholds].sort((a, b) => a.value - b.value);

    for (let i = 0; i < sortedThresholds.length; i++) {
      if (rate <= sortedThresholds[i].value) {
        return sortedThresholds[i].color;
      }
    }

    // If no threshold is met, return the color of the highest threshold
    return sortedThresholds[sortedThresholds.length - 1].color;
  }

  static getConfigElement() {
    return document.createElement("octopus-energy-rates-card-editor");
  }
}

class OctopusEnergyRatesCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
    };
  }

  setConfig(config) {
    this._config = { ...OctopusEnergyRatesCard.getDefaultConfig(), ...config };
    this._config.targetTimes = this._config.targetTimes || [];
    this._config.colorThresholds = this._config.colorThresholds || [];
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

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
            selector: { entity: { filter: { domain: "sensor" } } },
            required: true,
          },
          {
            name: "past",
            label: "Past Rates Entity",
            selector: { entity: { filter: { domain: "sensor" } } },
          },
          {
            name: "future",
            label: "Future Rates Entity",
            selector: { entity: { filter: { domain: "sensor" } } },
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
        // Handle nested updates for colorThresholds and targetTimes
        newConfig.colorThresholds = this._updateNestedArray(newConfig.colorThresholds, ev.detail.value, 'colorThresholds');
        newConfig.targetTimes = this._updateNestedArray(newConfig.targetTimes, ev.detail.value, 'targetTimes');
      }

      this._config = newConfig;
      this.requestUpdate();
    }

    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _updateNestedArray(array, changes, prefix) {
    if (!Array.isArray(array)) {
      array = [];
    }
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

customElements.define("octopus-energy-rates-card-editor", OctopusEnergyRatesCardEditor);


customElements.define("octopus-energy-rates-card", OctopusEnergyRatesCard);


window.customCards = window.customCards || [];
window.customCards.push({
  type: "octopus-energy-rates-card",
  name: "Octopus Energy Rates Card",
  preview: true,
  description: "Displays the energy rates for Octopus Energy",
});
