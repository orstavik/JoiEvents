// Flattened DOM                   | DOM context
//----------------------------------------------------------------
//  div                            | 1. main
//    slot-comp                    | 1. main
//      slot-comp#root             | A. slot-comp#root
//        span                     | A. slot-comp#root
//          slot                   | A. slot-comp#root
//            shadow-comp          | 1. main
//              shadow-comp#root   | B. shadow-comp#root
//                h1               | B. shadow-comp#root

//template with slotted web comp with shadowDOM
const template = document.createElement("template");
template.innerHTML = `
<div id="root">
  <slot-comp>
    <shadow-comp></shadow-comp>
  </slot-comp>
</div>`;


class SlotComp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<span><slot></slot></span>";
  }
}

customElements.define("slot-comp", SlotComp);

class ShadowComp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<h1>hello sunshine</h1>";
  }
}

customElements.define("shadow-comp", ShadowComp);

//method that produce a new version of this DOM each time.
export function cleanDom() {
  const root = document.querySelector("#root");
  root && root.remove();
  document.body.appendChild(template.content.cloneNode(true));
  const dom = {
    div: document.querySelector("div"),
    slot: document.querySelector("slot-comp"),
    slotRoot: document.querySelector("slot-comp").shadowRoot,
    slotSpan: document.querySelector("slot-comp").shadowRoot.children[0],
    slotSlot: document.querySelector("slot-comp").shadowRoot.children[0].children[0],
    shadowComp: document.querySelector("shadow-comp"),
    shadowRoot: document.querySelector("shadow-comp").shadowRoot,
    shadowH1: document.querySelector("shadow-comp").shadowRoot.children[0]
  };
  return dom;
}