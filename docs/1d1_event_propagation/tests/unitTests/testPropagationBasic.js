import {eventTargetName} from "./useCase1.js";

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

export const propBC = {
  name: `propagation: {composed: true, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: true, bubbles: true});
  }
};
export const propC = {
  name: `propagation: {composed: true, bubbles: false}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: true, bubbles: false});
  }
};
export const propB = {
  name: `propagation: {composed: false, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: false, bubbles: true});
  }
};
export const prop = {
  name: `propagation: {composed: false, bubbles: false`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {composed: false, bubbles: false});
  }
};
export const propABC  = {
  name: `propagation: {async: true, composed: true, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: true, bubbles: true});
  }
};
export const propAC = {
  name: `propagation: {async: true, composed: true, bubbles: false}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: true, bubbles: false});
  }
};
export const propAB = {
  name: `propagation: {async: true, composed: false, bubbles: true}`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: false, bubbles: true});
  }
};
export const propA = {
  name: `propagation: {async: true, composed: false, bubbles: false`,
  fun: function (res, usecase) {
    addListenersAndDispatchEvent(usecase, res, {async: true, composed: false, bubbles: false});
  }
};