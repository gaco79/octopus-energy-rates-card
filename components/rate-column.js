import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import { getRateColor } from '../utils/rate-utils.js';

class RateColumn extends LitElement {
  static get properties() {
    return {
      rates: { type: Array },
      config: { type: Object },
      hass: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex: 1;
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
        width: 50%;
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

  renderRateRow(rate) {
    const { hour12, showday, unitstr, roundUnits, multiplier } = this.config.display;

    const startDate = new Date(rate.start);
    const endDate = new Date(rate.end);

    const formattedTime = startDate.toLocaleTimeString(navigator.language, {
      hour: "numeric",
      minute: "2-digit",
      hour12,
    });

    const formattedDay = showday
      ? startDate.toLocaleDateString(navigator.language, { weekday: "short" }) + " "
      : "";

    const rateValue = (rate.value_inc_vat * multiplier).toFixed(roundUnits);

    const color = getRateColor(rate.value_inc_vat, this.config.colorThresholds);
    const style = `background-color: ${color}; border-color: ${color};`;

    const targetTime = this.getTargetTime(startDate, endDate);
    const prefix = targetTime ? targetTime.prefix : "";

    return html`
      <tr>
        <td
          style="border-image: linear-gradient(to right, var(--card-background-color) 20%, ${color} 100%) 1; text-align:right; padding-right:1rem;"
        >
          ${prefix ? html`<ha-icon icon="${prefix}"></ha-icon>` : ""}
          ${formattedDay}${formattedTime}
        </td>
        <td class="rate" style="${style}">${rateValue}${unitstr}</td>
      </tr>
    `;
  }

  getTargetTime(start, end) {
    for (const tt of this.config.targetTimes) {
      const entityState = this.hass.states[tt.entity];
      if (entityState?.attributes.target_times) {
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
}

customElements.define('rate-column', RateColumn);