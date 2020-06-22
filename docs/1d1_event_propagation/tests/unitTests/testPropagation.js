import {cleanDom} from "./useCase1.js";

let res1 = "";
let res2 = "";
let res3 = "";

function domWithListeners() {
  const dom = cleanDom();
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
  return dom;
}

function makeTestFunction(targetName, options1, options2,){
  return function(){
    res1 = res2 = res3 = "";
    const dom = domWithListeners();
    dom[targetName].dispatchEvent(new Event("click", options1), options2);
  }
}

function getResults(){
  return res1 + res2 + ":" + res3;
}

export const testProp = [{
  name: "dispatchEvent: shadowH1: composed NO bubbles NO async NO",
  expect: "shadowRoot shadowH1 shadowH1 +-+:122",
  fun: makeTestFunction("shadowH1"),
  result:getResults
}, {
  name: "dispatchEvent: shadowH1: composed: NO bubbles: YES",
  expect: "shadowRoot shadowH1 shadowH1 shadowRoot +-+-:1223",
  fun: makeTestFunction("shadowH1", {bubbles: true}),
  result:getResults
}, {
  name: "dispatchEvent: shadowH1: composed: YES bubbles: NO",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowComp +++++++-+-:1111121222",
  fun: makeTestFunction("shadowH1", {composed: true}),
  result:getResults,
}, {
  name: "dispatchEvent: shadowH1: composed: YES bubbles: YES",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowRoot shadowComp slotSlot slotSpan slotRoot slot div +++++++-+-------:1111121223233333",
  fun: makeTestFunction("shadowH1", {composed: true, bubbles: true}),
  result:getResults,
}, {
  name: "dispatchEvent2: composed: NO bubbles: NO",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = domWithListeners();
    dom.shadowComp.dispatchEvent(new Event("click"));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp +++++-+:1111122",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "dispatchEvent2: composed: NO bubbles: YES",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = domWithListeners();
    dom.shadowComp.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div +++++-+-----:111112233333",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "dispatchEvent2: composed: YES bubbles: NO",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = domWithListeners();
    dom.shadowComp.dispatchEvent(new Event("click", {composed: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp +++++-+:1111122",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}, {
  name: "dispatchEvent2: composed: YES bubbles: YES",
  fun: function () {
    res1 = res2 = res3 = "";
    const dom = domWithListeners();
    dom.shadowComp.dispatchEvent(new Event("click", {composed: true, bubbles: true}));
  },
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div +++++-+-----:111112233333",
  result: function () {
    return res1 + res2 + ":" + res3;
  }
}];