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
    shadow: document.querySelector("shadow-comp"),
    shadowRoot: document.querySelector("shadow-comp").shadowRoot,
    shadowH1: document.querySelector("shadow-comp").shadowRoot.children[0]
  }
}

function arrayEquals(one, two) {
  if (!two)
    return false;
  if (one.length != two.length)
    return false;
  for (var i = 0, l = one.length; i < l; i++) {
    if (one[i] instanceof Array && two[i] instanceof Array) {
      if (!arrayEquals(one[i], two[i]))
        return false;
    } else if (one[i] != two[i]) {
      return false;
    }
  }
  return true;
}

export const tests = [];

(function () {
  const res = [];
  let dom;
  tests.push({
    name: "currentTarget during all bubble event listeners",
    fun: function () {
      dom = cleanDom();
      for (let elName in dom) {
        dom[elName].addEventListener("click", function (e) {
          res.push(e.currentTarget.tagName || e.currentTarget.constructor.name);
        }, {});
      }
      dom.shadowH1.dispatchEvent(new Event("click"));
    },
    expect: function () {
      return arrayEquals(res, ["H1", "ShadowRoot", "SHADOW-COMP", "SLOT", "SPAN", "ShadowRoot", "SLOT-COMP", "DIV"]);
    }
  });
})();

// (function () {
//   let dom, res;
//   tests.push({
//     name: "simple event listener 2",
//     fun: function () {
//       dom = cleanDom();
//       dom.shadowH1.addEventListener("click", function (e) {
//         res = 2;
//       }, {});
//       dom.shadowH1.dispatchEvent(new Event("click"));
//     },
//     expect: function () {
//       return res === 2;
//     }
//   });
// })();
//
