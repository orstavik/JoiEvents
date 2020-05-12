
//the textcaret is the IME element. This element is responsible for the composition events.
//this element is responsible for showing the text "under construction/during composition",
//and this element would be responsible for showing a user a selection of alternatives per composition sequence.
//
//The best way to organize this element, is to provide a lookup interface for the composition sequence.
//This interface would essentially be a sequence to option list.
//This could be installed on a per browser, per user, per OS, per app, per any mechanism.
//There would be a default list.
//and the TextCaret can listen for an attribute that sets a particular sequenceToSelection language map.
//If needed, the TextCaret can be given the surrounding text content context in as two objects, before and after.
//But.. This is not really a TextCaret job. This should be implemented as a suggestive spelling element.
//Again, something that could be altered by user settings in the browser.
//
//There are different ways to implement TextCarets. Style can vary. Preferences can vary.
//The browser could install different default TextCaret elements when they install different IME.
//The browser could have a default TextCaret who is the GOD TextCaret component (kinda like they have now..).

//but the user should be able to set this himself/herself.
// Install and choose default TextCaret element implementation.
//The language files should be as pure text.

class TextCaret extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<style>
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
</style>
<span></span>
<div contenteditable></div>
`;
    this._span = this.shadowRoot.children[1];
    this._composeSequence = [];

    // this.shadowRoot.addEventListener("compositionstart", this._onCompositionstart.bind(this));
    this.shadowRoot.addEventListener("compositionupdate", this._onCompositionupdate.bind(this));
    this.shadowRoot.addEventListener("compositionend", this._onCompositionend.bind(this));
  }

  // _onCompositionstart(e) {
  //   this._composeSequence = [];
  // }
  //
  _onCompositionupdate(e) {
    this._composeSequence.push(e.data);
    //try to use a setting for a custom imeget the ime language, use either the default setting of the user, or a custom property on the TextCaret element
    // const suggestions = window.calcSuggestions(this._composeSequence, this.getAttribute("ime"));
    // if(suggestions.length > 1)
    //   show dropDown selection, that can be navigated using arrows and mouse/touch;
    // this._span.innerText = suggestions[0]
    this._span.innerText = e.data;//suggestions[0]
  }

  _onCompositionend() {
    this._span.innerText = "";
  }
}

customElements.define("text-caret", TextCaret);