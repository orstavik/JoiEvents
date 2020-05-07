class OriginalCheckBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  div{
    border: 1px solid grey;
    width: 1em;
    height: 1em;
  }
</style>
<div></div>
      `;
    this._checkBox = this.shadowRoot.children[1];
    this.checked = false;
    this.addEventListener("click", e => e.setDefault(this._onClick.bind(this)));
  }

  _onClick() {
    this.checked = !this.checked;
    this._checkBox.innerText = this.checked ? "x" : "";
  }
}

customElements.define("check-box", CheckBox);