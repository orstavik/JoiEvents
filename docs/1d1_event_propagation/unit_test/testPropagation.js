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
  return {
    div: document.querySelector("div"),
    slot: document.querySelector("slot-comp"),
    slotRoot: document.querySelector("slot-comp").shadowRoot,
    slotSpan: document.querySelector("slot-comp").shadowRoot.children[0],
    slotSlot: document.querySelector("slot-comp").shadowRoot.children[0].children[0],
    shadowComp: document.querySelector("shadow-comp"),
    shadowRoot: document.querySelector("shadow-comp").shadowRoot,
    shadowH1: document.querySelector("shadow-comp").shadowRoot.children[0]
  }
}

let res = "";
export const testProp = [{
  name: "propagation: composed: NO bubbles: NO",
  fun: function () {
    res = "";
    const dom = cleanDom();
    for (let elName in dom) {
      dom[elName].addEventListener("click", function (e) {
        res += elName + "-" + e.eventPhase + " ";
      }, {});
      dom[elName].addEventListener("click", function (e) {
        res += elName + "+" + e.eventPhase + " ";
      }, true);
    }
    dom.shadowH1.dispatchEvent(new Event("click"));
  },
  expect: "shadowRoot+1 shadowH1-2 shadowH1+2 ",
  result: function () {
    return res;
  }
}, {
  name: "propagation: composed: NO bubbles: YES",
  fun: function () {
    res = "";
    const dom = cleanDom();
    for (let elName in dom) {
      dom[elName].addEventListener("click", function (e) {
        res += elName + "-" + e.eventPhase + " ";
      }, {});
      dom[elName].addEventListener("click", function (e) {
        res += elName + "+" + e.eventPhase + " ";
      }, true);
    }
    dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "shadowRoot+1 shadowH1-2 shadowH1+2 shadowRoot-3 ",
  result: function () {
    return res;
  }
}, {
  name: "propagation: composed: YES bubbles: NO",
  fun: function () {
    res = "";
    const dom = cleanDom();
    for (let elName in dom) {
      dom[elName].addEventListener("click", function (e) {
        res += elName + "-" + e.eventPhase + " ";
      }, {});
      dom[elName].addEventListener("click", function (e) {
        res += elName + "+" + e.eventPhase + " ";
      }, true);
    }
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true}));
  },
  expect: "div+1 slot+1 slotRoot+1 slotSpan+1 slotSlot+1 shadowComp+2 shadowRoot+1 shadowH1-2 shadowH1+2 shadowComp-2 ",
  result: function () {
    return res;
  }
}, {
  name: "propagation: composed: YES bubbles: YES",
  fun: function () {
    res = "";
    const dom = cleanDom();
    for (let elName in dom) {
      dom[elName].addEventListener("click", function (e) {
        res += elName + "-" + e.eventPhase + " ";
      }, {});
      dom[elName].addEventListener("click", function (e) {
        res += elName + "+" + e.eventPhase + " ";
      }, true);
    }
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div+1 slot+1 slotRoot+1 slotSpan+1 slotSlot+1 shadowComp+2 shadowRoot+1 shadowH1-2 shadowH1+2 shadowRoot-3 shadowComp-2 slotSlot-3 slotSpan-3 slotRoot-3 slot-3 div-3 ",
  result: function () {
    return res;
  }
}];