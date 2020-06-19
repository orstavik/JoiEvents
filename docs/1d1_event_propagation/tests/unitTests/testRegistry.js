let res, dom, cb;

export const testRegistry = [{
  name: " registry 1: adding one event listener",
  fun: function () {
    dom = document.createElement("h1");
    cb = function (e) {
      res += "!";
    };
    dom.addEventListener("click", cb);
    res = getEventListeners(dom, "click").length;
    dom.dispatchEvent(new Event("click"));
  },
  expect: "1!",
  result: function () {
    return res;
  }
}, {
  name: "registry 2: removeEventListener",
  fun: function () {
    res = "nothing";
    dom = document.createElement("h1");
    cb = function (e) {
      res += "!";
    };
    dom.addEventListener("click", cb);
    res = "" + getEventListeners(dom, "click").length;
    dom.removeEventListener("click", cb);
    res += getEventListeners(dom, "click").length;
    dom.dispatchEvent(new Event("click"));
  },
  expect: "10",
  result: function () {
    return res;
  }
}];