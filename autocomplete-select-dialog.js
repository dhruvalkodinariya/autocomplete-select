import { html, css } from 'lit-element';
import { AutocompleteSelectDialogBase } from './autocomplete-select-dialog-base';
import { repeat } from 'lit-html/directives/repeat';
import { cache } from 'lit-html/directives/cache.js';
import './autocomplete-select-list-item';

export class AutocompleteSelectDialog extends AutocompleteSelectDialogBase {

  static get styles(){
    return [
      super.styles,
      css`
        :host {
          display: none;
          box-sizing: border-box;
          background: var(--dw-select-bg-color, var(--mdc-theme-background));
          flex-direction: column;
          -ms-flex-direction: column;
          -webkit-flex-direction: column;
          outline: none;
          z-index: 100;
          width: var(--dw-select-dialog-width,300px);
          /* max-width: var(--dw-select-dialog-width,100%); */
          margin: var(--dw-select-dialog-margin, 0px auto);
          /* border:1px solid #dddddd; */
        }

        :host([opened]) {
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;
        }

        :host([opened][mobile-mode]) {
          animation: slideInUp 0.2s forwards;
        }

        :host(:not([mobile-mode])[opened]) {
          -webkit-animation-name: fadeIn;
          animation-name: fadeIn;
          -moz-animation-name: fadeIn;
          -o-animation-name: fadeIn;
          -webkit-animation-duration: 500ms;
          animation-duration: 500ms;
          animation-timing-function: ease-in-out;
          -webkit-animation-timing-function: ease-in-out;
          -moz-animation-timing-function: ease-in-out;
          -o-animation-timing-function: ease-in-out;
          animation-fill-mode: forwards;
          -webkit-animation-fill-mode: forwards;
          -moz-animation-fill-mode: forwards;
          -o-animation-fill-mode: forwards;
        }

        @keyframes slideInUp {
          from {
            transform: translate3d(0, 100%, 0);
          }

          to {
            transform: translate3d(0, 0, 0);
          }
        }

        @-webkit-keyframes fadeIn {
          0% {opacity: 0;}
          100% {opacity: 1;}
        }
        @keyframes fadeIn {
          0% {opacity: 0;}
          100% {opacity: 1;}
        }

        :host([mobile-mode]) {
          width: 100%;
        }

        :host([mobile-mode]) {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        :host([mobile-mode][full-height]) {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 50px;
        }

        .main-content .items-container  .item.kb-highlighted {
          background: var(--dw-select-kb-highlighted-bg-color, rgba(0,0,0,0.12));
        }

        .main-content .items-container autocomplete-select-list-item.hidden {
          display: none;
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
       * Input property. Display multiselect in mobile mode (full screen) and no keyboard support
       * Default value: false
       */
      mobileMode: { type: Boolean, reflect: true, attribute: 'mobile-mode' },
      /**
       * Input property. A full set of items to filter the visible options from. The items can be of either String or Object type.
       */
      items: { type: Array },

      value: String,

      itemLabel: String,

      itemValue: String,

      /**
       * Sorted items based on groupBy.
       * Template loop is written on this property.
       */
      _items: { type: Array },
      /**
       * Keyboard highlighted index
       */
      _kbHighlightedIndex: { type: Boolean },
      /**
       * Entries of selected item's inexes
       * key: index in `_items`
       * value: `true`
       */
      _selectedMap: { type: Object },
      /**
       * Live selected items, Initially it is copied from "selected"
       * It can be of either String, object or Array type.
       */
      _selected: { type: Array },

      _filterQuery: String

    };
  }

  constructor(){
    super();
    this.opened = false;
    this.mobileMode = false;
    this._items = [];
    this._kbHighlightedIndex = 0;
    this._selectedMap = {};
    this._resize = this.debounce(() => {
      this.refit();
    }, 500);
  }

  /**
   * Show the dropdown content
   */
  open() {
    if(this.opened){
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

  connectedCallback() {
    super.connectedCallback();
    if(!this.opened) {
      return;
    }

    this._refitPending = true;
    this.updateComplete.then((result) => {
      if(this._refitPending && result && this.opened) {
        this.refit();
      }
      this._refitPending = false;
    });
  }


  render() {
    return html`
        <div id="scroller" class="main-content">
          <div class="items-container">
            ${repeat(this._items, (item)=>item[this.itemValue], (item, index) => html`
              <autocomplete-select-list-item class="item ${index == this._kbHighlightedIndex ? 'kb-highlighted' : ''} ${this._isItemFilteredOut(index) ? 'hidden' : ''}" .item=${item} ?selected=${this._isItemSelected(item)} @click="${(e)=>{this._clickOnItem(e,item)}}" .itemLabel="${this.itemLabel}"></autocomplete-select-list-item>
            `)}
          </div>
        </div>
    `;
  }

  

  shouldUpdate(changedProps) {
    super.shouldUpdate(changedProps);
    
    let openedChanged = changedProps.has('opened')

    if(this.opened){
      if(openedChanged || changedProps.has('items')) {
        // this._computeGroupByItems();
        this._items = this.items;
      }
      if(openedChanged || changedProps.has('items') || changedProps.has('value')) {
        this._copyInputValue();
        this._resetKbHighlightIndex();
      }
      if(openedChanged) {
        this._onOpened();
      }
    }

    if(!this.opened && openedChanged) {
      this._onClosed();
    }
    return openedChanged || this.opened;
  }

  updated(changedProps){
    super.updated(changedProps);
    
    if(changedProps.has('opened') && (this.opened || changedProps.get('opened')) && changedProps.get('opened') !== this.opened) {
      this._triggerOpenedChange();
    }


    if(!this.mobileMode && this.opened && (changedProps.has('_kbHighlightedIndex') || changedProps.has('opened'))) {
      let itemEl = this.shadowRoot.querySelectorAll('.item')[this._kbHighlightedIndex];
      if(itemEl) {
        itemEl.scrollIntoView(false);
      }
    }

    
    if(this.opened && (changedProps.has('items') || changedProps.has('opened'))) {
      this._refitPending = false;
      this.refit();
      
      if(this.mobileMode){
        // setTimeout(() => {
          this.refit();
        // });
      }
    }

    if(changedProps.has('_filterQuery')){
      this._updateFilter();
      this.requestUpdate();
      setTimeout(() => {
        this.refit();
      });
    }
  }

  _copyInputValue() {
      let selectedMap = {};
      this._value = this.value || this._emptyValue;
      this._selected = this._findItemByValue(this.items, this._value);
      selectedMap[this._value] = true;
      this._selectedMap = selectedMap;
    }

    _findItemByValue(items, value){
      return items.find((item) => {
        let key = item[this.itemValue];
        return key === value;
      });
    }

  _triggerOpenedChange() {
    let openedChangeEvent = new CustomEvent('opened-changed', {
      detail: {
        opened: this.opened
      }
    });
    this.dispatchEvent(openedChangeEvent);
  }

  _addResizeEventListeners(){
    this._removeResizeEventListeners();
    window.addEventListener('resize', this._resize);
  }

  _removeResizeEventListeners(){
    window.removeEventListener('resize', this._resize);
  }

  debounce(func, delay) {
    let debounceTimer;

    return function() { 
    let context = this;
    let args = arguments;
       clearTimeout(debounceTimer) 
       debounceTimer  = setTimeout(() => func.apply(context, args), delay) 
    } 
  };

  _onOpened() {
    super._onOpened();
    this._addResizeEventListeners();
  }

  _onClosed() {
    super._onClosed();
    this._removeResizeEventListeners();
  }

  _onDownKeyDown(e) {
    for(let i = (this._kbHighlightedIndex + 1); i < this._items.length; i++) {
      if(!this._filteredApplied || this._filteredIndexMap[i]){
        this._kbHighlightedIndex = i;
        break;
      }
    }
  }

  _onEnterKeyDown(e) {
    let item = this._items[this._kbHighlightedIndex];
    if(item) {
      this.selectByItem(item);
      this._filterQuery = '';
    }
  }

  _onUpKeyDown(e) {
    for(let i = (this._kbHighlightedIndex - 1); i >= 0; i--) {
      if(!this._filteredApplied || this._filteredIndexMap[i]){
        this._kbHighlightedIndex = i;
        break;
      }
    }
  }

  _onEscKeyDown(e) {
    this._resetKbHighlightIndex();
  }

  _resetKbHighlightIndex() {
    this._kbHighlightedIndex = this._items.findIndex((item, index) => {
      if(!this._filteredApplied || this._filteredIndexMap[index]){
        return true;
      }
    });
  }

  _isItemSelected(item){
    let value = item[this.itemValue];
    
    return Boolean(this._selectedMap[value]);
  }

  selectByItem(item) {
    // already selected
    // if(this._isItemSelected(item)) {
    //   return;
    // }

    let itemValue = item[this.itemValue];
    let key = itemValue || this._emptyValue;
    
    let oldKey = this._value || this._emptyValue;
    
    delete this._selectedMap[oldKey];   

    this._selectedMap[key] = true;

    this._selected = item;
    
    this._value = itemValue;
    this._triggerValueChange();
    
  }

  _triggerValueChange() {
    this.close();
    this.value = this._value;
    this.selected = this._selected;

    let valueChangeEvent = new CustomEvent('value-changed', {
      detail: {
        value: this.value,
        selected: this.selected
      }
    });
    this.dispatchEvent(valueChangeEvent);
  }

  _updateFilter() {
    if(!this._filterQuery) {
      this._filteredIndexMap = {};
      this._filteredApplied = false;
      this._resetKbHighlightIndex();
      return;
    }
    
    let filteredIndex = {};
    this._items.forEach((item, index) => {
      let isFiltered = this._filter(item, this._filterQuery, this.itemLabel);
      if(isFiltered) {
        filteredIndex[index] = true;
      }
    });
    this._filteredIndexMap = filteredIndex;
    this._filteredApplied = true;
    this._resetKbHighlightIndex();
  }

  _filter(item, query, itemLabel){
    let label;

    if(itemLabel) {
      label = item[itemLabel];
    } else {
      label = item;
    }
    return label.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  }

  _isItemFilteredOut(index) {
    if(!this._filteredApplied) {
      return false;
    }

    return this._filteredIndexMap[index] ? false : true;
  }

  _clickOnItem(e,item){
    if(item) {
      this.selectByItem(item);
      this._filterQuery = '';
    }
  }
}
customElements.define('autocomplete-select-dialog', AutocompleteSelectDialog);