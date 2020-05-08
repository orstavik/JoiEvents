import {} from "../../joi2.js";

class UpdatedInputCheckbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  span {
    border: 1px solid grey;
    width: 1em;
    height: 1em;
    display: inline-block;
  }
</style>
<span tabindex="0"></span>`;
    this._checkBox = this.shadowRoot.children[1];
    this._checked = false;

    //1. the state change is done as the defaultAction task. No ctrlZ, no ugly.
    this.shadowRoot.addEventListener("click", e => e.setDefault(e => !e.defaultPrevented && this.requestCheck()));
    this.shadowRoot.addEventListener("keydown", e => e.key === "Space" && e.setDefault(e => !e.defaultPrevented && this.requestCheck()));
  }

  static get observedAttributes() {
    return ["default-checked"];
  }

  //2. a default-checked attribute replaces the checked attribute
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "default-checked") {
      if (oldValue === null || newValue === null)
        newValue ? this.setAttribute("checked", "") : this.removeAttribute("checked");
    }
  }

  //3. the checked attribute and property are in sync
  get checked() {
    return this.hasAttribute("checked");
  }

  set checked(value) {
    if (value ^ this.hasAttribute("checked"))
      value ? this.setAttribute("checked", "") : this.removeAttribute("checked ");
  }

  requestCheck() {
    //here, we could dispatch a new event beforecheck
    this.hasAttribute("checked") ?
      this.removeAttribute("checked ") :
      this.setAttribute("checked", "");
    this._dispatchInputChange();
  }

  _dispatchInputChange(){
    this.dispatchEvent(new Event("input", {composed: true, bubbles: true}));
    this.dispatchEvent(new Event("change", {composed: true, bubbles: true}));
  }
}

customElements.define("check-box", UpdatedInputCheckbox);