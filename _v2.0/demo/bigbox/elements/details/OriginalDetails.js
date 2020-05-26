import {} from "../../../../src/joi2.js";

class OriginalDetails extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  slot:not([name]) {display: none;}
  :host, :host([open]) slot { display: block;}
  ::slotted([slot=summary])::before { content: "▶ "; font-family: monospace; vertical-align: top;}
  :host([open]) ::slotted([slot=summary])::before { content: "▼ "; }
</style>
<slot name="summary"></slot>
<slot></slot>`;
    this._summarySlot = this.shadowRoot.children[1];
    this._contentSlot = this.shadowRoot.children[2];
    this._summarySlot.addEventListener("click", e => /*e.isTrusted && */ e.setDefault(e => this.requestToggle(e)));
    this.open = false;                               //todo 1.  in the updated version, we want the e.isTrusted to be used.
  }                                                  //todo 2.  in the updated version, we want to remove the slot=name and use slottablesCallback instead and set the slot on the slotted element automatically.

  static get observedAttributes() {
    return ["open"];
  }

  //we only listen for changes when the "open" attribute is either added or removed
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === null || newValue === null)
      (window["toggleTick"] || setTimeout)(() => this.dispatchEvent(new Event("toggle")));
  }

  set open(value) {
    !!value ? this.setAttribute("open", "") : this.removeAttribute("open");
  }

  get open() {
    return this.hasAttribute("open");
  }

  requestToggle(e) {
    if (e.defaultPrevented)
      return;
    this.open = !this.open;
  }
}

customElements.define("original-details", OriginalDetails);