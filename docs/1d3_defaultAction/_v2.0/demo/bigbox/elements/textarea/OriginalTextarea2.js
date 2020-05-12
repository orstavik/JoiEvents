import {SlottablesEventMixin} from "../../../joi2.js";

class OriginalTextarea extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({mode: "open"});
    // this.shadowRoot.innerHTML =`<span  contenteditable></span>`;
    this.addEventListener("beforeinput", e => {
      e.preventDefault();
    });
    this.addEventListener("compositionstart", e => {
      e.preventDefault();
    });
    this.addEventListener("compositionupdate", e => {
      e.preventDefault();
    });
    this.addEventListener("compositionend", e => {
      e.preventDefault();
    });
    this.style = "cursor:none";
    Promise.resolve().then(()=>{Promise.resolve().then(()=>{this.setAttribute("contenteditable", "")})});
  }
}

customElements.define("original-textarea", OriginalTextarea);