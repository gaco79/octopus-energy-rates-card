import { LitElement } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

export class RateColumn extends LitElement {
  static get properties() {
    return {
      rates: { type: Array },
      config: { type: Object },
      hass: { type: Object },
    };
  }

  static get styles() {
    return css`
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
    return html`
        <div class="rate-column">
          <table>
            ${this.rates.map(rate => this.renderRateRow(rate))}
          </table>
        </div>
      `;
  }
}