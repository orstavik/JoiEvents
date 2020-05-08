import {} from "../../joi2.js";

class OriginalA extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  /*the selectors must target the slot, so that they will not be overridden by other selectors on the host node*/
  :host([href]) slot { 
    color: blue; 
    text-decoration: underline; 
    text-decoration-color: blue;
  }
  :host([href].pseudo-visited) slot {
    color: purple;
    text-decoration-color: purple;
  }
  :host(:focus) { 
    border: 1px solid orange; 
  }
</style>
<span><slot></slot></span>`;//the span added here is to allow the shadowDOM to contain a tabindex value itself.
    this._focusable = this.shadowRoot.children[1];
    this._slot = this._focusable.children[0];
    this.addEventListener("click", e => e.setDefault(e => this._clickAction()));
    this.addEventListener("auxclick", e => e.button === 1 && e.setDefault(e => this._auxclickAction()));
  }

  static get observedAttributes() {
    return ["href"];
  }

  //we only observe the href attribute
  attributeChangedCallback(name, oldValue, newValue) {
    //const isVisited = history.pageIsVisited(new URL(newValue, document.baseURI).href);
    // this obviously cannot happen as it would allow a script to read the user's browsing history using brute force
    // and send it back to its own server. Here, we just use a random 50/50 to paint a link as visited or not.
    const isVisited = Math.random() > 0.5;
    (isVisited) ?
      this.classList.add("pseudo-visited") :
      this.classList.remove("pseudo-visited");
    newValue ?
      this._focusable.setAttribute("tabindex", "0") :
      this._focusable.removeAttribute("tabindex");
  }

  _clickAction() {
    const link = this.getAttribute("href");
    link && (location.href = link);
  }

  _auxclickAction() {
    const link = this.getAttribute("href");
    link && window.open(link, "_blank");
  }
}

customElements.define("original-a", OriginalA);