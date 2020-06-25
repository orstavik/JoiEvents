import {cleanDom} from "./useCase1.js";

let res;

function a(e) {
  res += "c";
}

function b(e) {
  res += "d";
}

function c(e) {
  res += "c";
}

function getResult() {
  return res;
}

export const testOnce = [{
  name: "once: removeEventListener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", a, {once: true});
    h1.removeEventListener("click", a);
    h1.addEventListener("click", a);
    h1.removeEventListener("click", a, {once: true});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "",
  result: getResult
}, {
  name: "once: add two event listeners, one with once and one without",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", a);
    h1.addEventListener("click", a, {once: true});
    h1.addEventListener("click", b, {once: true});
    h1.addEventListener("click", b);

    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "abaa",
  result: getResult
},{
  name: "once: 1",
  fun: function () {
    res = "";
    let dom = cleanDom();
    dom.div.addEventListener("click", a, {once: 1});
    dom.div.addEventListener("click", a, {once: true});
    dom.div.dispatchEvent(new Event("click", {bubbles: true}));
    dom.div.dispatchEvent(new Event("click"));
  },
  expect: "a",
  result: getResult
},

  {
    name: "once: removeEventListener",
    fun: function () {
      res = "";
      let dom = cleanDom();
      dom.div.addEventListener("click", a, {once: true});
      dom.div.removeEventListener("click", a);
      dom.div.addEventListener("click", a);
      dom.div.removeEventListener("click", a, {once: true});
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "",
    result: getResult
  },

  {
    name: "once: add two event listeners, one with once and one without",
    fun: function () {
      res = "";
      let dom = cleanDom();
      dom.div.addEventListener("click", a);
      dom.div.addEventListener("click", a, {once: true});
      dom.div.addEventListener("click", b, {once: true});
      dom.div.addEventListener("click", b);
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "abaa",
    result: getResult
  },

  {
    name: "once: two listeners to the same element",
    fun: function () {
      res = "";
      let dom = cleanDom();
      dom.div.addEventListener("click", a);
      dom.div.addEventListener("click", a, {once: true});
      dom.div.addEventListener("click", a, {once: true});
      dom.div.addEventListener("click", b);
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
      dom.div.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "ababab",
    result: getResult
  },

  {
    name: "once: {capture:true, bubbles: true, once: true}",
    fun: function () {
      res = "";
      const h1 = document.createElement("h1");


      h1.addEventListener("click", a);
      h1.addEventListener("click", b, {once: true});
      // h1.addEventListener("click", d, {once: true});
      h1.addEventListener("click", c, {capture: true, bubbles: true, once: true});

      h1.dispatchEvent(new Event("click", {bubbles: true}));
      h1.dispatchEvent(new Event("click", {bubbles: true}));
      h1.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "abcaa",
    result: getResult
  },

  {
    name: "once: {capture:true, bubbles: true, once: true}",
    fun: function () {
      res = "";
      const h1 = document.createElement("h1");
      h1.addEventListener("click", a);
      h1.addEventListener("click", b, {once: true});
      h1.addEventListener("click", c, {capture: true, bubbles: true, once: true});
      h1.dispatchEvent(new Event("click", {bubbles: true}));
      h1.dispatchEvent(new Event("click", {bubbles: true}));
      h1.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "abcaa",
    result: getResult
  },

  {
    name: "once: slotted element",
    fun: function () {
      res = "";
      const dom = cleanDom(true);
      dom.slot.addEventListener("click", a, {once: true});
      dom.slot.addEventListener("click", b);
      dom.slot.dispatchEvent(new Event("click", {bubbles: true}));
      dom.shadowComp.dispatchEvent(new Event("click", {bubbles: true}));
      dom.shadowComp.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "abbb",
    result: getResult
  },

  {
    name: "once: does not propagates through shadowRoot",
    fun: function () {
      res = "";
      const dom = cleanDom(true);
      dom.shadowH1.addEventListener("click", a, {once: true});
      dom.div.addEventListener("click", b);
      dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
      dom.shadowH1.dispatchEvent(new Event("click", {bubbles: true}));
    },
    expect: "a",
    result: getResult
  }];