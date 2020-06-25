import {cleanDom, shadowCompWithExcludedLightDomDiv, simpleMatroschka} from "./useCase1.js";

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

let res1 = "", res2 = "";

function getResult() {
  return res1;
}

function makeTest(useCase) {
  return function () {
    res1 = "";
    for (let name in useCase) {

      function comparePaths(e) {
        const composedPath = e.composedPath();
        const scopedPath = scopedPaths(composedPath[0]); //target is wrong here
        if (!arrayEquals(scopedPath.flat(Infinity), composedPath))
          res1 += name;
        if (!sameDOMScope(scopedPath))
          res2 += name;
      }

      useCase[name].addEventListener("click", comparePaths);
      useCase[name].dispatchEvent(new Event("click"));
      useCase[name].removeEventListener("click", comparePaths);
    }
  };
}

export const testScopedPaths = [{
  name: "useCase1: inside shadow, then slotted",
  fun: makeTest(cleanDom()),
  expect: "",
  result: getResult
}, {
  name: "useCase2: shadowCompWithExcludedLightDomDiv",
  fun: makeTest(shadowCompWithExcludedLightDomDiv()),
  expect: "",
  result: getResult
}, {
  name: "useCase3: simple slotmatroschka",
  fun: makeTest(simpleMatroschka()),
  expect: "",
  result: getResult
}];