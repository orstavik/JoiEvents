import {eventTargetName, popTargets, useCases} from "./useCase1.js";
import {filterComposedTargets} from "../dispatchEventOptionAsync.js";

let res;

function result() {
  return res;
}

function addEventListeners(targets) {
  for (let el of targets) {
    let name = eventTargetName(el);
    const capture = name.toUpperCase() + " ";
    const bubble = name.toLowerCase() + " ";
    el.addEventListener("click", function (e) {
      res += capture;
    }, true);
    el.addEventListener("click", function (e) {
      res += bubble;
    });
  }
}

function makeExpectationBubblesComposed(scopedPath, bubbles) {
  const bubbleOrTargetTrailNodes = bubbles ?
    scopedPath.flat(Infinity) :
    filterComposedTargets(scopedPath);
  const captureTrailNodes = scopedPath.flat(Infinity).reverse();

  const bubbleOrTargetTrail = bubbleOrTargetTrailNodes.map(name => eventTargetName(name).toLowerCase());
  const captureTrail = captureTrailNodes.map(name => eventTargetName(name).toUpperCase());

  return captureTrail.join(" ") + " " + bubbleOrTargetTrail.join(" ") + " ";
}

const propAlternatives = [
  {composed: true, bubbles: true},
  {composed: true, bubbles: false},
  {composed: false, bubbles: true},
  {composed: false, bubbles: false}
];

export const basicPropTest = [];

for (let usecase of useCases) {
  //att!! reusing usecase elements and listeners between tests
  const scopedPath = usecase.makeDomBranch();
  const targets = scopedPath.flat(Infinity);
  addEventListeners(targets);

  for (let options of propAlternatives) {
    for (let i = 0; i < targets.length; i++) {
      let target = targets[i];
      let scopedPathSlice = popTargets(scopedPath, i);
      if (!options.composed) {
        while (scopedPathSlice[0] instanceof Array)
          scopedPathSlice = scopedPathSlice[0];
      }
      basicPropTest.push({
        name: `propagation: ${JSON.stringify(options)}: ${usecase.name} ${i}`,
        fun: function () {
          res = "";
          target.dispatchEvent(new Event("click", options));
        },
        expect: makeExpectationBubblesComposed(scopedPathSlice, options.bubbles),
        result
      });
    }
  }
}