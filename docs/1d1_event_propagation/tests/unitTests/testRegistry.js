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
    const eventListeners = getEventListeners(dom, "click");
    const listenerObject = eventListeners[0];
    res = "" + eventListeners.length + listenerObject?.removed;
    dom.removeEventListener("click", cb);
    res += getEventListeners(dom, "click").length;
    res += listenerObject?.removed;
    dom.dispatchEvent(new Event("click"));
  },
  expect: "1false0true",
  result: function () {
    return res;
  }
}];