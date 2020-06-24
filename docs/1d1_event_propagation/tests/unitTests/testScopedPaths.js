import {cleanDom} from "./useCase1.js";

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

function sameDOMScope(paths) {
  return paths.every(path => sameDOMScopeImpl(path));
}

function sameDOMScopeImpl(path) {
  if(!path.filter(target => target instanceof Array).every(path => sameDOMScopeImpl(path)))
    return false;

  const els = path.filter(target => !(target instanceof Array));
  let last = els.pop();

  if (last === window) {
    if (els.length === 0)
      return true;
    last = els.pop();
    return last === document && els.every(target => target.getRootNode() === last);
  }

  if (last instanceof ShadowRoot || last instanceof HTMLElement)
    return els.every(target => target.getRootNode() === last);
  return false;
}

let res1 = "", res2 = "";

function testPathsOnElement(name, element) {
  const func = function (e) {
    const composedPath = e.composedPath();
    const scopedPath = scopedPaths(composedPath[0]); //target is wrong here
    if (!arrayEquals(scopedPath.flat(Infinity), composedPath))
      res1 += name;
    if (!sameDOMScope(scopedPath))
      res2 += name;
  };
  element.addEventListener("click", func);
  element.dispatchEvent(new Event("click"));
  element.removeEventListener("click", func);
}

export const testScopedPaths = [{
  name: "useCase1: inside shadow, then slotted",
  fun: function () {
    res1 = "";
    res2 = "";
    const dom = cleanDom();
    for (let name in dom)
      testPathsOnElement(name, dom[name]);
  },
  expect: "",
  result: function () {
    return res1 + res2;
  }
}];