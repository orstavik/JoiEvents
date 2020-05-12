class TextCaret extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `<style>
  @keyframes blink { 
    50% { border-color: transparent; } 
  }
  :host(:focus-within) span {
    animation: blink .5s step-end infinite alternate;
    border-style: solid;
    border-color: black;
    border-width: 0 1px 1px 0;
  }
  div {
    position: fixed;
    top: -2000px;
    left: -2000px;
    width: 1px;
    height: 1px;
  }
  span { line-height: 1em; } /*prevents the line height of the span to alter with the dead key layout*/ 
</style><span></span><div contenteditable></div>`;
    this._span = this.shadowRoot.children[1];

    this.shadowRoot.addEventListener("compositionupdate", this._onCompositionupdate.bind(this));
    this.shadowRoot.addEventListener("compositionend", this._onCompositionend.bind(this));
    //todo this needs to handle the loss of focus. I think that the compositionend event will be triggered here, but this might not be the case..
  }

  _onCompositionupdate(e) {
    this._span.innerText = e.data;
  }

  _onCompositionend(e) {
    this._span.innerText = "";
    this.dispatchEvent(new InputEvent("beforeinput", e));
  }
}

customElements.define("text-caret", TextCaret);