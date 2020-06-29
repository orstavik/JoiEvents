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

function sameDOMScope(path) {
  //document-window context special case: must be either [window] or [..., document, window]
  if (arrayEquals(path, [window]))
    return true;
  if (path[path.length - 1] === window && path[path.length - 2] === document)
    path = path.slice(0, path.length - 2);
  else if (path[path.length - 1] === window)
    return false;
  else if (path[path.length - 1] === document)
    //todo native bouncing events such as focus and other?? can have this as their last one... must have the test cases to learn how this works.
    return false;

  return path.every(tOrArr =>
    tOrArr instanceof Array ? sameDOMScope(tOrArr) : tOrArr.getRootNode() === path[path.length - 1]
  );
}

import {eventTargetName, popTargets} from "./useCase1.js";

function scopedPathsTest(res, usecase) {
  const dom = usecase();
  const usecaseFlat = dom.flat(Infinity);
  let usecaseSlice = dom;
  let usecaseFlatSlice = usecaseFlat;
  while (usecaseFlatSlice.length) {
    let target = usecaseFlatSlice[0];
    //test composed
    let producedScopedPaths = scopedPaths(target, true);
    if (!arrayEquals(producedScopedPaths, usecaseSlice))
      return res.push("notImplement/error in usecase composed?");
    let producedScopedPathsFalse = scopedPaths(target, false);
    let composedFalseExpected = usecaseSlice;
    while (composedFalseExpected[0] instanceof Array)
      composedFalseExpected = composedFalseExpected[0];
    if (!arrayEquals(producedScopedPathsFalse, composedFalseExpected))
      return res.push("notImplement/error in usecase non-composed?");

    usecaseSlice = popTargets(usecaseSlice, 1);
    usecaseFlat.shift();
  }
}

function composedPathTest(res, usecase) {
  const usecaseFlat = usecase().flat(Infinity);
  for (let element of usecaseFlat) {
    function comparePaths(e) {
      const composedPath = e.composedPath();
      const scopedPath = scopedPaths(e.target, true);
      if (!arrayEquals(scopedPath.flat(Infinity), composedPath) || !sameDOMScope(scopedPath))
        res.push(eventTargetName(element));
    }

    element.addEventListener("click", comparePaths);
    element.dispatchEvent(new Event("click", {composed: true}));
    element.removeEventListener("click", comparePaths);
  }
}

export const testScopedPaths = [{
  name: "scopedPathsTest",
  fun: scopedPathsTest,
  expect: ""
}];

export const testComposedPath = [{
  name: "composedPaths",
  fun: composedPathTest,
  expect: ""
}];
