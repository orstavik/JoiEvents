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

import {eventTargetName, popTargets, useCases} from "./useCase1.js";

let res;

function result() {
  return res;
}

const expect = "";

function makeScopedPathsTest(usecase) {

  return function scopedPathsTest() {
    const usecaseFlat = usecase.flat(Infinity);
    res = "";
    let usecaseSlice = usecase;
    let usecaseFlatSlice = usecaseFlat;
    while (usecaseFlatSlice.length) {
      let target = usecaseFlatSlice[0];
      //test composed
      let producedScopedPaths = scopedPaths(target, true);
      if (!arrayEquals(producedScopedPaths, usecaseSlice))
        return res += "error in usecase composed?" + i;
      let producedScopedPathsFalse = scopedPaths(target, false);
      let composedFalseExpected = usecaseSlice;
      while (composedFalseExpected[0] instanceof Array)
        composedFalseExpected = composedFalseExpected[0];
      if (!arrayEquals(producedScopedPathsFalse, composedFalseExpected))
        return res += "error in usecase non-composed?" + i;

      usecaseSlice = popTargets(usecaseSlice, 1);
      usecaseFlat.shift();
    }
  };
}

function makeComposedPathTest(usecaseFlat) {

  return function composedPathTest() {
    res = "";
    for (let element of usecaseFlat) {
      function comparePaths(e) {
        const composedPath = e.composedPath();
        const scopedPath = scopedPaths(e.target, true);
        if (!arrayEquals(scopedPath.flat(Infinity), composedPath) || !sameDOMScope(scopedPath))
          res += eventTargetName(element);
      }

      element.addEventListener("click", comparePaths);
      element.dispatchEvent(new Event("click", {composed: true}));
      element.removeEventListener("click", comparePaths);
    }
  };
}

export const testScopedPaths = useCases.map(usecase => {
  const usecaseDom = usecase.makeDomBranch();
  return {
    name: "scopedPaths: " + usecase.name,
    fun: makeScopedPathsTest(usecaseDom),
    expect,
    result
  };
});

export const testComposedPath = useCases.map(usecase => {
  const usecaseFlat = usecase.makeDomBranch().flat(Infinity);
  return {
    name: "composedPaths: " + usecase.name,
    fun: makeComposedPathTest(usecaseFlat),
    expect,
    result
  };
});