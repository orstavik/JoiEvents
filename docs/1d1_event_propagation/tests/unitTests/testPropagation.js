import {cleanDom} from "./useCase1.js";

function domWithListeners(res1, res2, res3) {
  const dom = cleanDom();
  for (let elName in dom) {
    dom[elName].addEventListener("click", function (e) {
      res1.push(elName + " ");
      res2.push("-");
      res3.push(e.eventPhase);
      Promise.resolve().then(() => res3.push("."))
    }, {});
    dom[elName].addEventListener("click", function (e) {
      res1.push(elName + " ");
      res2.push("+");
      res3.push(e.eventPhase);
      Promise.resolve().then(() => res3.push("."))
    }, true);
  }
  return dom;
}

function makeTestFunction(targetName, options1, options2,) {
  return function (res) {
    const res1 = [];
    const res2 = [];
    const res3 = [];
    const dom = domWithListeners(res1, res2, res3);
    dom[targetName].dispatchEvent(new Event("click", options1), options2);
    res.join = function(arg){
      return [...res1, ":", ...res2, ":", ...res3].join(arg);
    }
  }
}

function getResults() {
  // return res1 + ":" + res2 + ":" + res3;
}

export let testProp = [{
  name: "dispatchEvent: shadowH1: composed NO bubbles NO async NO",
  expect: "shadowRoot shadowH1 shadowH1 :+-+:122...",
  fun: makeTestFunction("shadowH1"),
  result: getResults
}, {
  name: "dispatchEvent: shadowH1: composed: NO bubbles: YES",
  expect: "shadowRoot shadowH1 shadowH1 shadowRoot :+-+-:1223....",
  fun: makeTestFunction("shadowH1", {bubbles: true}),
  result: getResults
}, {
  name: "dispatchEvent: shadowH1: composed: YES bubbles: NO",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowComp :+++++++-+-:1111121222..........",
  fun: makeTestFunction("shadowH1", {composed: true}),
  result: getResults,
}, {
  name: "dispatchEvent: shadowH1: composed: YES bubbles: YES",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowRoot shadowH1 shadowH1 shadowRoot shadowComp slotSlot slotSpan slotRoot slot div :+++++++-+-------:1111121223233333................",
  fun: makeTestFunction("shadowH1", {composed: true, bubbles: true}),
  result: getResults,
}, {
  name: "dispatchEvent2: composed: NO bubbles: NO",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp :+++++-+:1111122.......",
  fun: makeTestFunction("shadowComp"),
  result: getResults,
}, {
  name: "dispatchEvent2: composed: NO bubbles: YES",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div :+++++-+-----:111112233333............",
  fun: makeTestFunction("shadowComp", {bubbles: true}),
  result: getResults,
}, {
  name: "dispatchEvent2: composed: YES bubbles: NO",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp :+++++-+:1111122.......",
  fun: makeTestFunction("shadowComp", {composed: true}),
  result: getResults,
}, {
  name: "dispatchEvent2: composed: YES bubbles: YES",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div :+++++-+-----:111112233333............",
  fun: makeTestFunction("shadowComp", {bubbles: true, composed: true}),
  result: getResults,
}, {
  name: "dispatchEventAsync: composed",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp :+++++-+:1.1.1.1.1.2.2.",
  fun: makeTestFunction("shadowComp", {composed: true}, {async: true}),
  result: getResults,
}, {
  name: "dispatchEventAsync: bubbles",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div :+++++-+-----:1.1.1.1.1.2.2.3.3.3.3.3.",
  fun: makeTestFunction("shadowComp", {bubbles: true}, {async: true}),
  result: getResults,
}, {
  name: "dispatchEventAsync: ",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp :+++++-+:1.1.1.1.1.2.2.",
  fun: makeTestFunction("shadowComp", undefined, {async: true}),
  result: getResults,
}, {
  name: "dispatchEventAsync: composed bubbles",
  expect: "div slot slotRoot slotSpan slotSlot shadowComp shadowComp slotSlot slotSpan slotRoot slot div :+++++-+-----:1.1.1.1.1.2.2.3.3.3.3.3.",
  fun: makeTestFunction("shadowComp", {bubbles: true, composed: true}, {async: true}),
  result: getResults,
}];
// testProp = testProp.reverse().slice(0,1);