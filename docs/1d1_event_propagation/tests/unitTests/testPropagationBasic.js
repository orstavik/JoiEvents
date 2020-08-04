import {eventTargetName} from "./useCase1.js";
import {filterComposedTargets} from "../computePaths.js";

function addEventListeners(targets, res, async) {//todo push this into the usecase file?
  for (let el of targets) {
    let name = eventTargetName(el);
    el.addEventListener("click", function (e) {
      res.push(name.toUpperCase() + " ");
      async && Promise.resolve().then(()=>res.push("."));
    }, true);
    el.addEventListener("click", function (e) {
      res.push(name.toLowerCase() + " ");
      async && Promise.resolve().then(()=>res.push("."));
    });
  }
}

function addListenersAndDispatchEvent(usecase, res, options) {
  const targets = usecase().flat(Infinity);
  addEventListeners(targets, res, options.async);
  targets[0].dispatchEvent(new Event("click", options), options.async ? {async: true} : undefined);
}

function makeExpectationBubblesComposed(usecase, options) {
  let scopedPath = usecase();
  if (!options.composed) {
    while (scopedPath[0] instanceof Array)
      scopedPath = scopedPath[0];
  }
  const bubbleOrTargetTrailNodes = options.bubbles ?
    scopedPath.flat(Infinity) :
    filterComposedTargets(scopedPath);
  const captureTrailNodes = scopedPath.flat(Infinity).reverse();

  const bubbleOrTargetTrail = bubbleOrTargetTrailNodes.map(name => eventTargetName(name).toLowerCase());
  const captureTrail = captureTrailNodes.map(name => eventTargetName(name).toUpperCase());

  return captureTrail.join(" ") + " " + bubbleOrTargetTrail.join(" ") + " ";
}

export const propagationBubblesComposed = {
  name: `propagation: {composed: true, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: true, bubbles: true});
  }
};
export const propagationComposedOnly = {
  name: `propagation: {composed: true, bubbles: false}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: true, bubbles: false});
  }
};
export const propagationBubblesOnly = {
  name: `propagation: {composed: false, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: false, bubbles: true});
  }
};
export const propagationNoComposedNoBubbles = {
  name: `propagation: {composed: false, bubbles: false`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: false, bubbles: false});
  }
};
export const propagationBubblesComposedAsync  = {
  name: `propagation: {async: true, composed: true, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: true, bubbles: true});
  }
};
export const propagationComposedOnlyAsync = {
  name: `propagation: {async: true, composed: true, bubbles: false}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: true, bubbles: false});
  }
};
export const propagationBubblesOnlyAsync = {
  name: `propagation: {async: true, composed: false, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: false, bubbles: true});
  }
};
export const propagationNoComposedNoBubblesAsync = {
  name: `propagation: {async: true, composed: false, bubbles: false`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: false, bubbles: false});
  }
};
//
// const propAlternatives = [
//   {composed: true, bubbles: true},
//   {composed: true, bubbles: false},
//   {composed: false, bubbles: true},
//   {composed: false, bubbles: false}
// ];
//
// for (let options of propAlternatives) {
//   basicPropTest.push({
//     name: `propagation: ${JSON.stringify(options)}`,
//     fun: function (res, usecase) {
//       addListenersAndDispatchEvent(usecase, res, options);
//     },
//     expect: function (usecase) {
//       return makeExpectationBubblesComposed(usecase, options);
//     }
//   });
// }

