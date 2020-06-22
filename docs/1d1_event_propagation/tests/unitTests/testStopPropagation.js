import {cleanDom} from "./useCase1.js";

let res1 = "";

function domWithListeners() {
  const dom = cleanDom();
  for (let elName in dom) {
    dom[elName].addEventListener("click", function (e) {
      res1 += elName + " ";
    }, {});
    dom[elName].addEventListener("click", function (e) {
      res1 += elName + " ";
    }, true);
  }
  return dom;
}

let res4 = "";

export const testStopProp = [{
  name: "shadowTorpedo: stopPropagation(true)",
  fun: function () {
    res1 = "";
    const dom = domWithListeners();

    dom.shadowH1.addEventListener("click", function (e) {
      e.stopPropagation(true);
    });
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowComp slotSlot slotSpan slotRoot slot div ",
  result: function () {
    return res1;
  }
}, {
  name: "captureTorpedo: stopPropagation(true)",
  fun: function () {
    res1 = "";
    const dom = domWithListeners();

    dom.div.addEventListener("click", function (e) {
      e.stopPropagation(true);
    }, true);
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slotRoot slotSpan slotSlot shadowRoot shadowH1 shadowH1 shadowRoot slotSlot slotSpan slotRoot ",
  result: function () {
    return res1;
  }
}, {
  name: "slotTorpedo: stopPropagation(true)",
  fun: function () {
    res1 = "";
    const dom = domWithListeners();

    dom.slotSlot.addEventListener("click", function (e) {
      e.stopPropagation(true);
    });
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowRoot shadowComp slotSlot slot div ",
  result: function () {
    return res1;
  }
}, {
  name: "slotCaptureTorpedo: stopPropagation(true)",
  fun: function () {
    res1 = "";
    const dom = domWithListeners();

    dom.slotRoot.addEventListener("click", function (e) {
      e.stopPropagation(true);
    }, true);
    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slot slotRoot shadowComp shadowRoot shadowH1 shadowH1 shadowRoot shadowComp slot div ",
  result: function () {
    return res1;
  }
}];

export const testStopProp2 = [{
  name: "shadowTorpedo: addEventListener(.., .., {scoped: true}/{unstoppable: true} )",
  fun: function () {
    res1 = res4 = "";
    const dom = cleanDom();

    dom.div.addEventListener("click", function (e) {
      e.stopPropagation();
    }, true);

    dom.shadowH1.addEventListener("click", function (e) {
      res4 += "DifferentScope ";
    }, {scoped: true});

    dom.div.addEventListener("click", function (e) {
      res4 += "SameScope ";
    }, {scoped: true});

    dom.div.addEventListener("click", function (e) {
      res4 += "unstoppable";
    }, {unstoppable: true});

    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "DifferentScope unstoppable",
  result: function () {
    return res4;
  }
}, {
  name: "shadowTorpedo: addEventListener(.., .., {scoped: true}/{unstoppable: true} )",
  fun: function () {
    res1 = res4 = "";
    const dom = cleanDom();

    dom.shadowH1.addEventListener("click", function (e) {
      e.stopImmediatePropagation();
    }, true);

    dom.shadowH1.addEventListener("click", function (e) {
      res4 += "SameScope";
    }, {scoped: true});

    dom.div.addEventListener("click", function (e) {
      res4 += "DifferentScope";
    }, {scoped: true});

    dom.shadowH1.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "DifferentScope",
  result: function () {
    return res4;
  }
}, {
  name: "shadowTorpedo: Event.isScoped",
  fun: function () {
    res1 = res4 = "";
    const dom = cleanDom();

    dom.div.addEventListener("click", function (e) {
      e.stopPropagation();
    }, true);

    dom.shadowH1.addEventListener("click", function (e) {
      res4 += "DifferentScope";
    });
    dom.div.addEventListener("click", function (e) {
      res4 += "SameScope";
    });
    const event = new Event("click", {composed: true, bubbles: true});
    event.isScoped = true;
    dom.shadowH1.dispatchEvent(event);
  },
  expect: "DifferentScope",
  result: function () {
    return res4;
  }
}];