//template with slotted web comp with shadowDOM
const template = document.createElement("template");
template.innerHTML =
  `<div id="root">
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
function cleanDom() {
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
  addListenersToDOM(dom);
  return dom;
}

function addListenersToDOM(dom) {
  for (let elName in dom) {
    dom[elName].addEventListener("click", function (e) {
      res1 += elName + " ";
      res2 += "-";
      res3 += e.eventPhase;
    }, {});
    dom[elName].addEventListener("click", function (e) {
      res1 += elName + " ";
      res2 += "+";
      res3 += e.eventPhase;
    }, true);
  }
}

let res1 = "";
let res2 = "";
let res3 = "";
export const testProp = [{
  name: "propagation: composed: NO bubbles: NO",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowH1.dispatchEvent(new Event("click"));
  },
  expect: "shadowRoot shadowH1 shadowH1 +-+:122",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation: composed: NO bubbles: YES",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "shadowRoot shadowH1 shadowH1 shadowRoot +-+-:1223",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation: composed: YES bubbles: NO",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowComp +++++++-+-:1111121222",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation: composed: YES bubbles: YES",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowRoot shadowComp slotSlot slotSpan slotRoot slot div +++++++-+-------:1111121223233333",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation2: composed: NO bubbles: NO",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowComp.dispatchEvent(new Event("click"));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp +++++-+:1111122",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation2: composed: NO bubbles: YES",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowComp.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div +++++-+-----:111112233333",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation2: composed: YES bubbles: NO",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowComp.dispatchEvent(new Event("click", {composed: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp +++++-+:1111122",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "propagation2: composed: YES bubbles: YES",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = cleanDom();
    dom.shadowComp.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div +++++-+-----:111112233333",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}];