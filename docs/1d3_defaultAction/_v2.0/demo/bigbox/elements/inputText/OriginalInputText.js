import {} from "../../../joi2.js";
import {} from "../TextCaret/TextCaret.js";

class OriginalInputText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  :host(:focus-within) span.container {
    outline: 1px orangered ridge;
  }
  span{
    white-space: pre;
  }
  span.container {
    width: 50em;
    max-width: 50em;
    height: 1.5em;
    padding: 0 0.25em 0.25em 0;
  }
</style>
<span class="container"><span></span><text-caret></text-caret><span></span></span>`;
    this._pre = this.shadowRoot.children[1].children[0];
    this._editable = this.shadowRoot.children[1].children[1];
    this._post = this.shadowRoot.children[1].children[2];

    //listen only for the composing-completed beforeinput events.
    this._editable.addEventListener("beforeinput", e => !e.isComposing && e.setDefault(this._onBeforeinput.bind(this)));
    this.shadowRoot.addEventListener("keydown", this._onKeydown.bind(this));
  }

  static get observedAttributes() {
    return ["value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "value") {
      this.value = newValue;
    }
  }

  get value() {
    return this._pre.innerText + this._editable.innerText + this._post.innerText;
  }

  set value(textValue) {
    //todo convert the text to pure text
    this._pre.innerText = textValue;
    this._editable.innerText = "";
    this._post.innerText = "";
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

  _onBeforeinput(e) {
    if (e.inputType === "insertParagraph")
      this._pre.innerText += "\n";
    else if (e.inputType === "deleteContentBackward" && this._editable.innerText !== "")
      this._editable.innerText = "";
    else if (e.inputType === "deleteContentBackward" && this._editable.innerText === "" && this._pre.innerText.length > 0)
      this._pre.innerText = this._pre.innerText.slice(0, -1);
    else if (e.inputType === "insertText")
      this._pre.innerText += e.data;
    console.log(e.inputType)
    const inputEvent = new InputEvent("input", e);       //todo this is composed, but should be non-composed
    this.dispatchEvent(inputEvent);
  }

  _onKeydown(e) {
    if (e.code === "ArrowRight" && this._post.innerText.length > 0)
      return e.setDefault(this._moveRight.bind(this));
    if (e.code === "ArrowLeft" && this._pre.innerText.length > 0)
      return e.setDefault(this._moveLeft.bind(this));
    if (e.code === "Home")
      return e.setDefault(this._moveHome.bind(this));
    if (e.code === "End")
      return e.setDefault(this._moveEnd.bind(this));
    if (e.code === "Enter")//todo this should filter for modality keys such as shift and ctrlKey
      return e.setDefault(this._submit.bind(this));
  }

  _moveRight(e) {
    //todo implement e.ctrlKey
    const one = this._post.innerText[0];
    this._post.innerText = this._post.innerText.slice(1);
    this._pre.innerText += one;
  }

  _moveLeft(e) {
    //todo implement e.ctrlKey
    const one = this._pre.innerText[this._pre.innerText.length - 1];
    this._pre.innerText = this._pre.innerText.slice(0, this._pre.innerText.length - 1);
    this._post.innerText = one + this._post.innerText;
  }

  _moveHome(e) {
    //todo, not implemented home key that goes to next end of line
    this._post.innerText = this._pre.innerText + this._post.innerText;
    this._pre.innerText = "";
  }

  _moveEnd(e) {
    //todo, not implemented home key that goes to next end of line
    this._pre.innerText += this._post.innerText;
    this._post.innerText = "";
  }

  _submit(e) {
    this.form && this.form.requestSubmit();
  }
}

customElements.define("original-input-text", OriginalInputText);