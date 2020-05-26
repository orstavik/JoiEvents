import {} from "../../../../src/joi2.js";

class OriginalButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  :host(:focus) { 
    border: 1px solid orange; 
  }
  
  div{
    display: inline-block;
    background-color: rgb(240, 240, 240);
    border: 1px solid #a4a3a3;
    font: 400 13.3333px Arial;
    padding: 2px 6px;
  }
    
  div:hover{
    border: 1px solid  gray;
  }
</style>

<div>
  <span tabindex>
    <slot></slot>
  </span>
</div>`;//the span added here is to allow the shadowDOM to contain a tabindex value itself.
    this.shadowRoot.children[1].addEventListener("click", e => e.setDefault(this._onClick.bind(this)));
  }

  get form() {
    let parent = this.parentNode;
    while (!(parent instanceof HTMLFormElement))
      parent = parent.parentNode;
    return parent;
  }

  get type() {
    return this.getAttribute("type") || "submit";
  }

  _onClick() {
    if (this.type === "submit")
      return this.form.requestSubmit();
    if (this.type === "reset")
      return this.form.reset();
  }
}

customElements.define("original-button", OriginalButton);