import { LitElement, css, html } from 'https://unpkg.com/lit-element@2.4.0/lit-element.js?module';

class MGCList extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      data: { attribute: false },
      schema: { attribute: false },
    };
  }

  constructor() {
    super();
    this.data = [];
  }

  computeLabel(schema) {
    const localized = this.hass.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    if (localized !== '') {
      return localized;
    }
    return this.hass.localize(`ui.panel.lovelace.editor.card.mgc.${schema.name}`);
  }

  render() {
    const dataArray = Array.isArray(this.data) ? this.data : [];

    return html`
      <div>
        <ha-icon-button
          .label=${this.hass.localize('ui.common.add')}
          .path=${this.mdiPlus}
          @click=${this.addRow}
        ></ha-icon-button>
      </div>
      <div>
      ${dataArray.map((row, index) => html`
        <div class="list-entry">
        <ha-form
          .hass=${this.hass}
          .data=${row}
          .schema=${this.schema.schema}
          .index=${index}
          .computeLabel=${this.computeLabel}
          @value-changed=${this.valueChanged}
        ></ha-form>
        <ha-icon-button
          .label=${this.hass.localize('ui.common.clear')}
          .path=${this.mdiClose}
          .index=${index}
          @click=${this.removeRow}
        ></ha-icon-button>
        </div>
      `)}
      </div>
    `;
  }

  valueChanged(ev) {
    ev.stopPropagation();
    if (!Array.isArray(this.data) || !this.hass) {
      return;
    }
    const value = ev.detail.value || '';
    const index = (ev.target).index || 0;
    const newListValue = [...this.data];

    newListValue[index] = value;

    this.fireEvent('value-changed', { value: newListValue });
  }

  addRow(ev) {
    ev.stopPropagation();
    const value = {};
    if (!Array.isArray(this.data)) {
      this.fireEvent('value-changed', { value: [value] });
      return;
    }

    this.fireEvent('value-changed', { value: [...this.data, value] });
  }

  removeRow(ev) {
    ev.stopPropagation();
    if (!Array.isArray(this.data) || !this.hass) {
      return;
    }
    const index = (ev.currentTarget).index || 0;
    const newListValue = [...this.data];

    newListValue.splice(index, 1);

    this.fireEvent('value-changed', { value: newListValue });
  }

  fireEvent(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  static get styles() {
    return css`
    .list-entry {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .list-entry ha-form {
      flex-grow: 1;
    }
    `;
  }

  // Material Design Icons paths
  get mdiPlus() {
    return 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
  }

  get mdiClose() {
    return 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
  }
}

customElements.define('ha-form-mgc-list', MGCList);