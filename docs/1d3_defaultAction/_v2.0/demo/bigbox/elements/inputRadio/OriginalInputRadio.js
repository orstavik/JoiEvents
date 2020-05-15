import {} from "../../../joi2.js";
import {ObserveHelicopterParent} from "./HelicopterParentMixin.js";

Object.defineProperty(HTMLFormElement.prototype, "elements", {
  get: function(){
    return this.querySelectorAll(":not(form) input, :not(form) select, :not(form) button, :not(form) textarea, :not(form) original-input-radio");
  }
})

class OriginalInputRadio extends ObserveHelicopterParent(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  span {
    border: 1px solid grey;
    border-radius: 50%;
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
        window.addEventListener("click", e => e.defaultPrevented ? (this.checked = !this.checked) : this._dispatchInputChange(), {once: true});
      }
    }, true);
    window.addEventListener("keydown", e => {
      if (e.key !== "Space")
        return;
      if (e.composedPath()[2] === this) {
        this.checked = !this.checked;
        window.addEventListener("keydown", e => e.defaultPrevented ? (this.checked = !this.checked) : this._dispatchInputChange(), {once: true});
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

  static get observedParentType() {
    return HTMLFormElement;
  }

  parentChangedCallback(oldParent, newParent) {
    if (!this.checked)
      return;
    this.checked = false;
    this.checked = true;
  }

  get name() {
    return this.getAttribute("name") || "default";
  }

  get form() {
    let parent = this.parentNode;
    while (!(parent instanceof HTMLFormElement))
      parent = parent.parentNode;
    return parent;
  }

  get checked() {
    return this._checked;
  }

  set checked(value) {
    const check = !!value;
    this._checked = check;
    this._checkBox.innerText = check ? "o" : "";
    check ? this.classList.add("pseudo-checked") : this.classList.remove("pseudo-checked");
    if (value) {
      let elements = Array.from(this.form.elements);//form.elements must be overridden to add this original-input-radio element to the list
      elements = elements.filter(n => n instanceof OriginalInputRadio && n.name === this.name && n.checked);
      const otherCheckedRadioWithMyName = elements;
      for (let radio of otherCheckedRadioWithMyName) {
        if (radio !== this)
          radio.checked = false;
      }
    }
  }

  _dispatchInputChange() {
    this.dispatchEvent(new Event("input", {composed: true, bubbles: true}));
    this.dispatchEvent(new Event("change", {composed: true, bubbles: true}));
  }
}

customElements.define("original-input-radio", OriginalInputRadio);