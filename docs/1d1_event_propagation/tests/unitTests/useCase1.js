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

//<div id="root">
//  <slot-comp>
//    <shadow-comp></shadow-comp>
//  </slot-comp>
//</div>

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

export function cleanDom() {
  const div = document.createElement("div");
  const slotComp = document.createElement("slot-comp");
  const shadowComp = document.createElement("shadow-comp");
  div.appendChild(slotComp);
  slotComp.appendChild(shadowComp);
  return {
    div: div,
    slot: div.querySelector("slot-comp"),
    slotRoot: div.querySelector("slot-comp").shadowRoot,
    slotSpan: div.querySelector("slot-comp").shadowRoot.children[0],
    slotSlot: div.querySelector("slot-comp").shadowRoot.children[0].children[0],
    shadowComp: div.querySelector("shadow-comp"),
    shadowRoot: div.querySelector("shadow-comp").shadowRoot,
    shadowH1: div.querySelector("shadow-comp").shadowRoot.children[0]
  };
}