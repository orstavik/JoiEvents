import {} from "../../../../src/joi2.js";

class OriginalInputButton extends HTMLElement {
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
  
  :host([type=text]) div,
  :host(:not([type])) div {
    background: pink;
  }
    
  div:hover{
    border: 1px solid  gray;
  }
</style>

<div tabindex></div>`;
    this._div = this.shadowRoot.children[1];
    this._div.addEventListener("click", e => e.setDefault(this._onClick.bind(this)));
  }

  static get observedAttributes(){
    return ["value"];
  }

  attributeChangedCallback(name, oldValue, newValue){
    if (name === "value"){
      this._div.innerText = newValue || "";
    }
  }

  get form() {
    let parent = this.parentNode;
    while (!(parent instanceof HTMLFormElement))
      parent = parent.parentNode;
    return parent;
  }

  get type() {
    return this.getAttribute("type") || "text";
  }

  _onClick() {
    if (this.type === "submit")
      return this.form.requestSubmit();
    if (this.type === "reset")
      return this.form.reset();
    if (this.type === "button")
      return null;
  }
}

customElements.define("original-input-button", OriginalInputButton);