// import {} from "../src/nextTick.js"; //will run both with and without nextTick
// window["nextTick"] = window["nextTick"] || setTimeout;

class DetailsOpen extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  :host, slot[active] {
    display: block;
  }
  slot{
    display: none;
  }
</style>
<slot name="summary" active></slot>
<slot></slot>
      `;
    this._summarySlot = this.shadowRoot.children[1];
    this._contentSlot = this.shadowRoot.children[2];
    this._summarySlot.addEventListener("click", e => e.setDefault(this._onClick.bind(this)));
    this.open = false;
  }

  _onClick() {
    this.open = !this.open;
    this.open ?
      this._contentSlot.setAttribute("active", "") :
      this._contentSlot.removeAttribute("active");
    // toggleTick(() => this.dispatchEvent(new Event("toggle")));
    this.dispatchEvent(new Event("toggle"), {async: true});
  }
}

customElements.define("details-open", DetailsOpen);