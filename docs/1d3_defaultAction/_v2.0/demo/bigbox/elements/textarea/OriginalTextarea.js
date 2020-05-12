import {SlottablesEventMixin} from "../../../joi2.js";
import {} from "../TextCaret/TextCaret.js";

class OriginalTextarea extends SlottablesEventMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  @keyframes blink { 
    50% { border-right-color: #ff0000; } 
  }
  :host(:focus-within) div {
    outline: 1px orangered ridge;
  }
  span{
    white-space: pre;
  }
  span[contenteditable]:focus {
    border-right: 5px dotted yellow;
    background: pink;
    outline: none;
    animation: blink .5s step-end infinite alternate;
  }
  span.composition {
    border: 1px solid red;
  }
</style>
<div><span></span><text-caret></text-caret><span></span></div>`;
    this._pre = this.shadowRoot.children[1].children[0];
    this._editable = this.shadowRoot.children[1].children[1];
    this._post = this.shadowRoot.children[1].children[2];

    //listen only for the composing-completed beforeinput events.
    this._editable.addEventListener("beforeinput", e => !e.isComposing && e.setDefault(this._onBeforeinput.bind(this)));
    this.shadowRoot.addEventListener("keydown", this._onKeydown.bind(this));

    // this.addEventListener("slottables-changed", this._slottablesChanged.bind(this));
  }

  //set up the textarea in multiple ways. cols, rows, etc.
  // static get observedAttributes() {
  //   return ["checked"];
  // }
  //
  // attributeChangedCallback(name, oldValue, newValue) {
  //   if (name === "checked") {
  //     this.checked = newValue !== null;
  //   }
  // }

  // get value() {
  //   return this._pre.innerText + this._editable.innerText + this._post.innerText;
  // }
  //
  // set value(ignore) {
  // }
  //
  //simplified, assumes only a single text childNode
  // _slottablesChanged() {
  //   this._pre.innerText = this.childNodes[0].data;
  //   this._editable.innerText = "";
  //   this._post.innerText = "";
  // }
  _onBeforeinput(e) {
    this._pre.innerText += e.data;
    const inputEvent = new InputEvent("input", e);       //todo this is composed, but should be non-composed
    this.dispatchEvent(inputEvent);
  }

  _onKeydown(e) {
    if (e.code === "ArrowRight" && this._post.innerText.length > 0)
      return e.setDefault(this._moveRight.bind(this, e.ctrlKey));
    if (e.code === "ArrowLeft" && this._pre.innerText.length > 0)
      return e.setDefault(this._moveLeft.bind(this, e.ctrlKey));
  }

  _moveRight(ctrl) {
    //todo implement ctrl
    const one = this._post.innerText[0];
    this._post.innerText = this._post.innerText.slice(1);
    this._pre.innerText += one;
  }

  _moveLeft(ctrl) {
    //todo implement ctrl
    const one = this._pre.innerText[this._pre.innerText.length - 1];
    this._pre.innerText = this._pre.innerText.slice(0, this._pre.innerText.length - 1);
    this._post.innerText = one + this._post.innerText;
  }
}

customElements.define("original-textarea", OriginalTextarea);