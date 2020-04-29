import { LitElement, html ,css} from 'lit-element';
import '@material/mwc-textfield';
import './autocomplete-select-dialog';
import '@material/mwc-icon';

export class AutocompleteSelect extends LitElement {

  static get styles(){
    return [
      css`
        :host{
          display:block;
        }
        #dropdownContainer{
          width:var(--dw-select-dialog-input-width, 300px);
        }

        #overlay {
          position: fixed;
          display: none;
          top: 0; right: 0; bottom: 0; left: 0;
          background-color: var(--overlay-color, rgba(0,0,0,0.4));
          overflow: hidden;
          width: 100%; 
          height: 100%;
          z-index: 99;
          cursor: pointer;
        }

        :host([overlay]) #overlay {
          display:block;
        }

        :host([readOnly]) .main-container #dropdownContainer {
          cursor: default;
        }

        :host([readOnly]) .main-container #dropdownContainer .label,
        :host([readOnly]) .main-container #dropdownContainer .dropdown-input {
          opacity: 0.6;
        }
      `
    ];
  }

  static get properties() {
    return {
      /**
       * Input + Output property. True if the dropdown is open, false otherwise.
       */
      opened: { type: Boolean, reflect: true },
      /**
       * Input + Output property. The String value for the selected item of the multiselect.
       * It can be of either String or Array type.
       */
      value: String,

      items: String,
      /**
       * Output property. The selected item from the items array.
       * It can be of either String, object or Array type.
       */
      selected: Object,

      itemLabel: String,

      itemValue: String,
      /**
       * Input property. The orientation against which to align the menu dropdown horizontally relative to the dropdown trigger.
       * Possible values: "left", "right"
       * Default value: "left"
       */
      hAlign: String,
      /**
       * Input property. The orientation against which to align the menu dropdown vertically relative to the dropdown trigger.
       * Possible values: "top", "bottom"
       * Default value: "top"
       */
      vAlign: String,
      /**
       * Input property. The horizontal offset in pixels. Negtaive numbers allowed.
       * Default value: 0
       */
      hOffset: Number,
      /**
       * Input property. The vertical offset in pixels. Negtaive numbers allowed.
       * Default value: 0
       */
      vOffset: Number,
      /**
       * Input property. Display multiselect in mobile mode (full screen) and no keyboard support
       * Default value: false
       */
      mobileMode: { type: Boolean, reflect: true, attribute: 'mobile-mode' },

      /**
       * Input property.
       * When true, Show dialog in full screen even if items are very less in mobile mode
       * Default value: false
       */
      alwaysFullScreenInMobile: Boolean,

      /**
       * The element that should be used to position the element
       */
      _positionTarget: Object,

      /**
       * Default value is `false`.
       * When true, Show overlay, otherwise hide overlay.
       */
      _overlay: { type: Boolean, reflect: true, attribute: 'overlay' },

      /**
       * `true` show dropdown as readonly
       */
      readOnly: { type: Boolean, reflect: true },


      _dropdownRendered: Boolean,

      _filterQuery: String,

      /**
       * Input property. Set to true to mark the input as required.
       * Default value: false
       */
      required: { type: Boolean, reflect: true },
      /**
       * Input + Output property. Set to true if the value is invalid.
       * Default value: false
       */
      invalid: { type: Boolean, reflect: true },
      /**
       * Input property. The error message to display when invalid.
       */
      errorMessage: String,
    };
  }

  constructor() {
    super();
    this._onKeyDown = this._onKeyDown.bind(this);
    this.opened = false;
    this.items = [];
    this.required = false;
    this.invalid = false;
    this.errorMessage = 'Required';
    this.mobileMode = false;
    this._filterQuery='';
    this.hAlign = 'left';
    this.vAlign = 'top';
    this.selected = {};
    this.selectedValue = '';
    this.alwaysFullScreenInMobile = false;
    this._dropdownRendered = false;
    this._overlay = false;
    this.readOnly = false;
  }

  /**
   * Show the dropdown content
   */
  open() {
    if(this.opened || this.readOnly){
      return;
    }

    this.opened = true;
  }

  /**
   * Hide the dropdown content
   */
  close() {
    if(!this.opened){
      return;
    }
    this.opened = false;
  }

  shouldUpdate(changedProps) {
    if(!this.opened && changedProps.size === 1 && changedProps.has('_positionTarget')) {
      return false;
    }
    return true;
  }

  updated(changedProps){
    if(changedProps.has('_dropdownRendered')){
      this._dialogElement = this.shadowRoot.querySelector('autocomplete-select-dialog');
    }
    if(changedProps.has('value')){
      this.selected = this._setSelectedValue();
      this.selectedValue = this.selected[this.itemLabel] || '';
    }
  }

  firstUpdated(changedProps){
    super.updated(changedProps);
    this._positionTarget = this.shadowRoot.getElementById('dropdownContainer');
  }

  render() {
    if(this.opened){
      this._dropdownRendered = true;
    }

    return html`
      <div id="overlay"></div>
      ${this._renderTriggerElement()}
      ${this._dropdownRendered ? this._renderSelectDialog() : ''}
    `;
  }

  _renderTriggerElement() {
    return html`
      <mwc-textfield label="Name" outlined @focus="${this._onInputFocus}" @blur="${this._onInputBlur}" class="triggerElement" id="dropdownContainer" tabindex="0" .value=${this.selectedValue} @input=${this._onInput} iconTrailing="${this.opened?'arrow_drop_up':'arrow_drop_down'}" ?required="${this.required}" .validationMessage="${this.errorMessage}">
    </mwc-textfield>
    `;
  }

  _renderSelectDialog() {
    return html`
      <autocomplete-select-dialog
        .items=${this.items}
        .value=${this.value}
        .itemLabel=${this.itemLabel}
        .itemValue=${this.itemValue}
        .selected=${this.selected}
        .positionTarget=${this._positionTarget}
        .mobileMode=${this.mobileMode}
        .opened=${this.opened}
        .hAlign=${this.hAlign}
        .vAlign=${this.vAlign}
        .hOffset=${this.hOffset}
        .vOffset=${this.vOffset}
        .alwaysFullScreenInMobile=${this.alwaysFullScreenInMobile}
        ._filterQuery=${this._filterQuery}
        @value-changed=${this._valueChanged}
        @opened-changed=${this._openedChanged}
      ></autocomplete-select-dialog>
    `;
  }

  _setSelectedValue(){
    var selItem = this.items.find(item => {
        return item[this.itemValue] == this.value;
    });
    return selItem;
  }

  _onKeyDown(e) {
    var keyCode = e.keyCode || e.which;
    if(keyCode === 13) {
      this._onEnterKeyDown(e);
    }

    else if(keyCode === 38) {
      this._onUpKeyDown(e);
    }

    else if(keyCode === 40) {
      this._onDownKeyDown(e);
    }

    else if(keyCode === 27) {
      this._onEscKeyDown(e);
    }
  }

  _onEnterKeyDown(e) {
    if(!this.opened) {
      e.preventDefault();
      e.stopPropagation();
      this.opened = true;
    }
    this._dialogElement._onEnterKeyDown(e);
  }

  _onUpKeyDown(e) {
    this._dialogElement._onUpKeyDown(e);
  }

  _onDownKeyDown(e) {
    if(!this.opened) {
      e.preventDefault();
      e.stopPropagation();
      this.opened = true;
    }
    this._dialogElement._onDownKeyDown(e);
  }

  _onEscKeyDown(e) {
    if(this.opened) {
      e.preventDefault();
      e.stopPropagation();
      this.opened = false;
    }
    this._dialogElement._onEscKeyDown(e);
  }

  _onClick() {
    if(this.readOnly){
      return;
    }

    this.opened = !this.opened;
  }

  _onInput(e){
    this._filterQuery = e.target.value;
    this.open();
  }

  _onInputFocus(){
    this._positionTarget.select();
    setTimeout(()=>{
      this.open();
      this._positionTarget.addEventListener('keydown',this._onKeyDown);
    },100)
  }

  _onInputBlur(){
    this._positionTarget.value = this.selected[this.itemLabel] || '';
    setTimeout(()=>{
      this.close();
      this.validate();
    },160)
    
  }

  _openedChanged(e) {
    this.opened = e.detail.opened;
    // this._triggerOpenedChange();
    this._mobileModeOverlay();
  }

  _mobileModeOverlay() {
    let self = this;
    self._overlay = false;
    if(!self.mobileMode || !self.opened) {
      return;
    }

    //Show dropdown using animation, So overlay show after some time because remove a jerk.
    window.setTimeout(()=> {
      self._overlay = true;
    }, 100);
  }

  _valueChanged(e){
    this.value = e.detail.value;
    this.selected = e.detail.selected;
    this.selectedValue = this.selected[this.itemLabel];
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: e.detail
    }));
    this.validate();
  }

  validate(dryRun) {
    let invalid = false;
    if(this.required && (!this.value || !this.value.length)) {
      invalid = true;
    }

    if(!dryRun && this.invalid !== invalid) {
      this.invalid = invalid;
      this._triggerInvalidChange();
    }
    return invalid;
  }

  _triggerInvalidChange() {
    let invalidChangeEvent = new CustomEvent('invalid-changed', {
      detail: {
        invalid: this.invalid
      }
    });
    this.dispatchEvent(invalidChangeEvent);
  }
}
customElements.define('autocomplete-select', AutocompleteSelect);