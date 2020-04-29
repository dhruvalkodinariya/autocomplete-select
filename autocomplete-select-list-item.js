import { LitElement, html ,css} from 'lit-element';
import {Typography} from '@dreamworld/material-styles/typography';
import {styleMap} from 'lit-html/directives/style-map';
import '@material/mwc-icon';

export class AutocompleteSelectListItem extends LitElement {

  static get styles(){
    return[
      Typography,
      css`
        :host{
          display: flex;
          display: -ms-flexbox;
          display: -webkit-flex;
          flex-direction: row;
          -ms-flex-direction: row;
          -webkit-flex-direction: row;
          align-items: center;
          -ms-flex-align: center;
          -webkit-align-items: center;
          box-sizing: border-box;
          cursor: pointer;
          font-size: 16px;
          line-height: 16px;
          font-weight: 400;
          min-height: var(--dw-select-item-height, 48px);
          color: var(--dw-select-item-color, var(--primary-text-color));
        }

        .container {
          flex: 1;
          -ms-flex: 1 1 0.000000001px;
          -webkit-flex: 1;
          display: flex;
          display: -ms-flexbox;
          display: -webkit-flex;
          flex-direction: row;
          -ms-flex-direction: row;
          -webkit-flex-direction: row;
          align-items: center;
          -ms-flex-align: center;
          -webkit-align-items: center;
          box-sizing: border-box;
          padding: var(--dw-select-item-padding, 0px 16px);
          min-height: var(--dw-select-item-height, 48px);
          overflow: hidden; 
        }

        :host(:hover) {
          background: var(--dw-select-item-hover-color, rgba(0,0,0,0.06));
        }

        :host([disabled]) {
          opacity: var(--dw-select-item-disabled-opacity, 0.3);
          cursor: default;
        }

        .content {
          flex: 1;
          -ms-flex: 1 1 0.000000001px;
          -webkit-flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--dw-select-item-content-color,var(--mdc-theme-text-primary));
          text-transform: var(--dw-select-item-content-text-transform, initial);
          padding: var(--dw-select-item-content-padding, 0px);
          margin: var(--dw-select-item-content-margin, 0px);
        }

        .icon {
          -ms-flex: none;
          -webkit-flex: none;
          flex: none;
          height: var(--dw-select-item-icon-height, 24px);
          width: var(--dw-select-item-icon-width, 24px);
          margin: var(--dw-select-item-icon-margin, 0px 8px 0px 0px);
          color: var(--dw-select-item-icon-color);
        }

        :host([disabled]) .icon{
          color: var(--dw-select-item-disabled-icon-color);
        } 
        
        .check-icon {
          display: var(--dw-select-item-check-icon-display, block);
          -ms-flex: none;
          -webkit-flex: none;
          flex: none;
          height: 24px;
          width: 24px;
        }

        .icon mwc-icon{
          color: var(--mdc-theme-text-secondary);
        }

        .check-icon mwc-icon {
          color: var(--dw-select-check-icon, var(--mdc-theme-secondary));
        }
      `
    ];
  }

  static get properties() {
    return {
      item: { type: Object },
      selected: { type: Boolean },
      icon: { type: String },
      iconSize: { type: Number },
      itemLabel: { type:String }
    };
  }

  constructor(){
    super();
    this.icon = "account_circle";
  }

  render() {
    return html`
      <div class="container">
        <div class="icon" ?hidden="${!this.icon}">
          <mwc-icon>${this.icon}</mwc-icon>
        </div>
        <div class="content">${this.item[this.itemLabel]}</div>
        <div class="check-icon">${this.selected ? html `<mwc-icon>check_circle</mwc-icon>` : ''}</div>
      </div>
    `;
  }
}
customElements.define('autocomplete-select-list-item', AutocompleteSelectListItem);