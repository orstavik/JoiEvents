class ALink extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
  div{ color: blue;  }
</style>
<slot></slot>
      `;
    this._slot = this.shadowRoot.children[1];
    this.addEventListener("click", e => e.setDefault(this._onClick.bind(this)));
  }

  _onClick() {
    const link = this.getAttribute("href");
    if (!link)
      return;
    //here it should have dispatched a "navigate" event, so that it would be possible to distinguish from the rest of the click actions.
    location.href = link;//todo new URL(link, document.baseURI).href instead??
  }
}

customElements.define("a-link", ALink);