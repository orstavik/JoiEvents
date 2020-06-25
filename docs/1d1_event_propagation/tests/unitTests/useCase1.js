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

class NestedShadow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<b><shadow-comp></shadow-comp></b>";
  }
}

customElements.define("nested-shadow", NestedShadow);

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

function shadowSlotted() {
  const div = document.createElement("div");
  const slotComp = document.createElement("slot-comp");
  const shadowComp = document.createElement("shadow-comp");
  div.appendChild(slotComp);
  slotComp.appendChild(shadowComp);

  const slotRoot = div.querySelector("slot-comp").shadowRoot;
  const slotSpan = div.querySelector("slot-comp").shadowRoot.children[0];
  const slotSlot = div.querySelector("slot-comp").shadowRoot.children[0].children[0];
  const shadowRoot = div.querySelector("shadow-comp").shadowRoot;
  const shadowH1 = div.querySelector("shadow-comp").shadowRoot.children[0];

  return {
    all: {div, slotComp, slotRoot, slotSpan, slotSlot, shadowComp, shadowRoot, shadowH1},
    scopedPath: [
      [
        shadowH1,
        shadowRoot
      ],
      [
        shadowComp,
        [
          slotSlot,
          slotSpan,
          slotRoot],
        slotComp,
        div
      ]
    ]
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

function shadowCompWithExcludedLightDomDiv() {
  const shadowComp = document.createElement("shadow-comp");
  const div = document.createElement("div");
  shadowComp.appendChild(div);

  const shadowRoot = shadowComp.shadowRoot;
  const shadowH1 = shadowComp.shadowRoot.children[0];
  return {
    all: {shadowComp, shadowRoot, shadowH1, div},
    scopedPath: [
      [shadowH1, shadowRoot],
      [shadowComp]
    ],
    alternativePath: [
      [div, shadowComp]
    ]
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

function simpleMatroschka() {
  const matroshcka = document.createElement("matroschka-comp");
  const div = document.createElement("div");
  matroshcka.appendChild(div);
  const matroshckaRoot = matroshcka.shadowRoot;
  const slotComp = matroshcka.shadowRoot.children[0];
  const matroshckaSlot = matroshcka.shadowRoot.children[0].children[0];
  const slotCompRoot = matroshcka.shadowRoot.children[0].shadowRoot;
  const slotCompSpan = matroshcka.shadowRoot.children[0].shadowRoot.children[0];
  const slotCompSlot = matroshcka.shadowRoot.children[0].shadowRoot.children[0].children[0];

  return {
    all: {matroshcka, matroshckaRoot, slotComp, matroshckaSlot, slotCompRoot, slotCompSpan, slotCompSlot, div},
    scopedPath: [
      [
        div,
        [
          matroshckaSlot,
          [
            slotCompSlot,
            slotCompSpan,
            slotCompRoot
          ],
          slotComp,
          matroshckaRoot
        ],
        matroshcka
      ]
    ]
  }
}

//useCase4 nestedShadow

// Flattened DOM                   | DOM context
//----------------------------------------------------------------
//   nested-shadow                 | 1. main
//     nested-shadow#root          | A. nested-comp#root
//       b                         | A. nested-comp#root
//         shadow-comp             | A. nested-comp#root
//           shadow-comp#root      | B. shadow-comp#root
//             h1                  | B. shadow-comp#root

// 1. main          | A. nested-comp   | B. shadow-comp
//------------------------------------------------------------------
//<nested-shadow>   |                  |
//                  |#shadowRoot       |
//                  |  <b>             |
//                  |    <shadow-comp> |
//                  |                  |#shadowRoot
//                  |                  |  <h1>

function nestedShadow() {
  const nestedShadow = document.createElement("nested-shadow");
  const nestedRoot = nestedShadow.shadowRoot;
  const nestedB = nestedRoot.children[0];
  const shadowComp = nestedB.children[0];
  const shadowRoot = shadowComp.shadowRoot;
  const shadowH1 = shadowRoot.children[0];
  return {
    all: {nestedShadow, nestedRoot, nestedB, shadowComp, shadowRoot, shadowH1},
    scopedPath: [
      [
        shadowH1,
        shadowRoot
      ], [
        shadowComp,
        nestedB,
        nestedRoot
      ], [
        nestedShadow
      ]
    ]
  };
}

export const useCases = [{
  name: "shadow and slotted",
  makeDomBranch: shadowSlotted
}, {
  name: "simple SlotMatroschka",
  makeDomBranch: simpleMatroschka
}, {
  name: "lightDom el hidden by shadowDom",
  makeDomBranch: shadowCompWithExcludedLightDomDiv
}, {
  name: "shadow inside shadow",
  makeDomBranch: nestedShadow
}];

export function cleanDom() {//todo replace this one with the useCases
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