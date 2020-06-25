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

class MatroschkaComp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<slot-comp><slot>hello sunshine</slot></slot-comp>";
  }
}

customElements.define("matroschka-comp", MatroschkaComp);

//useCase1
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

export function cleanDom() {//todo rename to usecase1                                ゜
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

//useCase2  lightDom element hidden from render by a shadowDom

// Flattened DOM                   | DOM context
//----------------------------------------------------------------
//   shadow-comp                   | 1. main
//     shadow-comp#root            | B. shadow-comp#root
//       h1                        | B. shadow-comp#root
//  ?!?!  div                      | 1. main in JS, BUT excluded!! in the rendered DOM

//<shadow-comp>
//  <div></div>
//</shadow-comp>

export function shadowCompWithExcludedLightDomDiv() {
  const shadowComp = document.createElement("shadow-comp");
  const div = document.createElement("div");
  shadowComp.appendChild(div);
  return {
    shadowComp,
    shadowRoot: shadowComp.shadowRoot,
    shadowH1: shadowComp.shadowRoot.children[0],
    div
  };
}

//useCase3 simple slot Matroschka
// Flattened DOM                   | DOM context
//----------------------------------------------------------------
//  matroschka-comp                | 1. main
//    matroschka-comp#root         | A. matroschka-comp#root
//      slot-comp                  | A. matroschka-comp#root
//        slot                     | A. matroschka-comp#root
//          slot-comp#root         | B. slot-comp#root
//            span                 | B. slot-comp#root
//              slot               | B. slot-comp#root
//                div              | 1. main
//
//
// 1. main          | A. matroschka  | B. SlotComp
//----------------------------------------------------------------
//<matroschka-comp> |                |
//                  |#shadowRoot     |
//                  |  <slot-comp>   |
//                  |    <slot>      |
//                  |                |#shadowRoot
//                  |                |  <span>
//                  |                |    <slot>
//  <div>           |                |

export function simpleMatroschka() {
  const matroshcka = document.createElement("matroschka-comp");
  const div = document.createElement("div");
  matroshcka.appendChild(div);
  return {
    matroshcka,
    matroshckaRoot: matroshcka.shadowRoot,
    slotComp: matroshcka.shadowRoot.children[0],
    matroshckaSlot: matroshcka.shadowRoot.children[0].children[0],
    slotCompRoot: matroshcka.shadowRoot.children[0].shadowRoot,
    slotCompSpan: matroshcka.shadowRoot.children[0].shadowRoot.children[0],
    slotCompSlot: matroshcka.shadowRoot.children[0].shadowRoot.children[0].children[0],
    div
  };
}