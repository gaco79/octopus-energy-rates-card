import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import { getDefaultConfig } from './config/default-config.js';
import { getRatesFromStateObj, getFilteredRates, splitIntoColumns } from './utils/rate-utils.js';
import './components/rate-column.js';
import { OctopusEnergyRatesCardEditor } from "./components/editor.js";

export class OctopusEnergyRatesCard extends LitElement {
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
    if (!config.entities?.current) {
      throw new Error("You need to define a current entity");
    }
    this._config = {
      ...getDefaultConfig(),
      ...config,
      colorThresholds: config.colorThresholds || []
    };
  }

  static get styles() {
    return css`
      :host {
      }
      .card-content {
        display: flex;
        justify-content: space-around;
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

    const currentRates = getRatesFromStateObj(currentStateObj);
    const pastRates = pastStateObj ? getRatesFromStateObj(pastStateObj) : [];
    const futureRates = futureStateObj ? getRatesFromStateObj(futureStateObj) : [];

    const allRates = [...pastRates, ...currentRates, ...futureRates];
    const filteredRates = getFilteredRates(allRates, this._config.display.showpast);
    const columns = splitIntoColumns(filteredRates, this._config);

    return html`
      <ha-card header="${this._config.title}">
        <div class="card-content">
            ${columns.map(column => html`
              <rate-column
                .rates=${column}
                .config=${this._config}
                .hass=${this.hass}
              ></rate-column>
            `)}
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("octopus-energy-rates-card-editor");
  }
}

customElements.define("octopus-energy-rates-card", OctopusEnergyRatesCard);
customElements.define("octopus-energy-rates-card-editor", OctopusEnergyRatesCardEditor);


window.customCards = window.customCards || [];
window.customCards.push({
  type: "octopus-energy-rates-card",
  name: "Octopus Energy Rates Card",
  preview: true,
  description: "Displays the energy rates for Octopus Energy",
});