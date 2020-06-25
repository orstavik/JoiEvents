import {cleanDom, useCases} from "./useCase1.js";

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

let res;

function getResult() {
  return res;
}

function makeTest(useCase) {
  return function () {
    res = "";
    for (let [name, element] of Object.entries(useCase)) {

      function comparePaths(e) {
        const composedPath = e.composedPath();
        const scopedPath = scopedPaths(e.target);
        if (!arrayEquals(scopedPath.flat(Infinity), composedPath) || !sameDOMScope(scopedPath))
          res += name;
      }

      element.addEventListener("click", comparePaths);
      element.dispatchEvent(new Event("click"));
      element.removeEventListener("click", comparePaths);
    }
  };
}

export const testScopedPaths = useCases.map(useCaseFun=> {
  const useCase = useCaseFun();
  return {
    name: "scopedPaths: " + useCase.name,
    fun: makeTest(useCase.all),
    expect: "",
    result: getResult
  };
});
//todo add a test when the usecases are added to the DOM also.. Should i do this in the useCases function??