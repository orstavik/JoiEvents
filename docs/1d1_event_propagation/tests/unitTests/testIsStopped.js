//template with slotted web comp with shadowDOM
const template = document.createElement("template");
template.innerHTML =`
<div id="root">
  <slot-comp2>
    <shadow-comp2></shadow-comp2>
  </slot-comp2>
</div>`;

class SlotComp2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<span><slot></slot></span>";
  }
}

customElements.define("slot-comp2", SlotComp2);

class ShadowComp2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "<h1>hello sunshine</h1>";
  }
}

customElements.define("shadow-comp2", ShadowComp2);

//method that produce a new version of this DOM each time.
function cleanDom() {
  const root = document.querySelector("#root");
  root && root.remove();
  document.body.appendChild(template.content.cloneNode(true));
  const dom = {
    div: document.querySelector("div"),
    slot: document.querySelector("slot-comp2"),
    slotRoot: document.querySelector("slot-comp2").shadowRoot,
    slotSpan: document.querySelector("slot-comp2").shadowRoot.children[0],
    slotSlot: document.querySelector("slot-comp2").shadowRoot.children[0].children[0],
    shadow: document.querySelector("shadow-comp2"),
    shadowRoot: document.querySelector("shadow-comp2").shadowRoot,
    shadowH1: document.querySelector("shadow-comp2").shadowRoot.children[0]
  };
  // addListenersToDOM(dom);
  return dom;
}

let res1 = "";
let res2 = "";
let res3 = "";
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

let res4;
export const testIsStopped = [{
  name: "isStopped: before dispatch",
  fun: function () {
    res1 = res2 = res3 = res4 = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res4 += "omg";
    })
    const event = new Event("click");
    event.stopPropagation();
    res1 += isStopped(event) ? "1" : "wtf1";
    h1.dispatchEvent(event);
    const event2 = new Event("click");
    event2.stopImmediatePropagation();
    res1 += isStopped(event2) ? "2" : "wtf2";
    h1.dispatchEvent(event2);
    const event3 = new Event("click");
    event3.stopPropagation();
    res1 += isStopped(event3, true) ? "3" : "wtf3";
    h1.dispatchEvent(event3);
    const event4 = new Event("click");
    event4.stopImmediatePropagation();
    res1 += isStopped(event4, true) ? "4" : "wtf4";
    h1.dispatchEvent(event4);
  },
  expect: "1234",
  result: function () {
    return res1;
  }
// }, {
//   name: "isStopped: stopPropagation() and stopImmediatePropagation() before dispatch",
//   fun: function () {
//     res1 = res2 = res3 = "";
//     const dom = cleanDom();
//     dom.shadowComp
//     dom.shadowH1.dispatchEvent(new Event("click"));
//   },
//   expect: "shadowRoot shadowH1 shadowH1 +-+:122",
//   result: function () {
//     return res1 + res2 + ":" + res3;
//   }
}];