let res, dom, cb;

export const testRegistry = [{
  name: " registry 1: adding one event listener",
  fun: function () {
    dom = document.createElement("h1");
    cb = function (e) {
      res = 3;
    };
    dom.addEventListener("click", cb);
    dom.dispatchEvent(new Event("click"));
  },
  expect: function () {
    return res === 3 &&
      getEventListeners(dom, "click") &&
      getEventListeners(dom, "click").length === 1 &&
      getEventListeners(dom, "click")[0].listener === cb &&
      getEventListeners(dom, "click")[0].capture === false &&
      getEventListeners(dom, "click")[0].type === "click" &&
      getEventListeners(dom, "click", Event.CAPTURING_PHASE).length === 0 &&
      getEventListeners(dom, "click", Event.BUBBLING_PHASE).length === 1 &&
      getEventListeners(dom, "click", Event.AT_TARGET).length === 1;
  }
}, {
  name: "registry 2: removeEventListener",
  fun: function () {
    res = "nothing";
    dom = document.createElement("h1");
    cb = function (e) {
      res = 3;
    };
    dom.addEventListener("click", cb);
    dom.removeEventListener("click", cb);
    dom.dispatchEvent(new Event("click"));
  },
  expect: function () {
    return res === "nothing" && !getEventListeners(dom, "click")?.length;
  }
}];