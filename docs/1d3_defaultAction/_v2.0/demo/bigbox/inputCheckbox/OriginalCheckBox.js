import {} from "../../joi2.js";

class OriginalInputCheckbox extends HTMLElement {
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

    //the state change is done in advance of the event propagation.
    //If .preventDefault() is called on the event, then the defaultAction will undo/ctrl+z the state change.
    //To achieve this, the event's preventDefault() is wrapped so
    //that it will add a separate event listener at the last node of the propagation instead.

    //example: ctrl+z undo
    window.addEventListener("click", e => {
      if (e.composedPath()[2] === this) {
        this.checked = !this.checked;
        window.addEventListener("click",  e => e.defaultPrevented ? (this.checked = !this.checked): this._dispatchInputChange(), {once: true});
      }
    }, true);
    window.addEventListener("keydown", e => {
      if (e.key !== "Space")
        return;
      if (e.composedPath()[2] === this) {
        this.checked = !this.checked;
        window.addEventListener("keydown", e => e.defaultPrevented ? (this.checked = !this.checked): this._dispatchInputChange(), {once: true});
      }
    }, true);
  }

  //this doesn't do anything with the type="checkbox"
  //the type shouldn't be used to distinguish different types of elements like the native input element does.
  //you should never change the type of an input element dynamically, and thus you should not set this selection up as
  //an attribute.
  static get observedAttributes() {
    return ["checked"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "checked") {
      this.checked = newValue !== null;
    }
  }

  get checked() {
    return this._checked;
  }

  set checked(value) {
    const check = !!value;
    this._checked = check;
    this._checkBox.innerText = check ? "x" : "";
    check ? this.classList.add("pseudo-checked") : this.classList.remove("pseudo-checked");
  }

  _dispatchInputChange(){
    this.dispatchEvent(new Event("input", {composed: true, bubbles: true}));
    this.dispatchEvent(new Event("change", {composed: true, bubbles: true}));
  }
}
//todo we need to make the HTMLSummaryElement too, because it has a special .tabIndex property. We cannot override the native .tabIndex I think??

customElements.define("original-input", OriginalInputCheckbox);