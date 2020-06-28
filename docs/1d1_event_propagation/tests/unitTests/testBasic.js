// const funkyBoy = (msg) => console.log(msg);
//
// function playBoy(msg) {
//   console.log(msg);
// }
//
//
//
//
// h1.addEventListener("click", function (e) {
//   console.log("Test 3: {once: true}, expect once")
// }, {once: true});
//
// h1.addEventListener("click", function (e) {
//   console.log("Test 3a: {once: undefined}, expect twice")
// }, {once: undefined});
//
//
// h1.addEventListener("click", function (e) {
//   console.log("Test 4: {once: 1}, expect once")
// }, {once: 1});
//
//
// // Test 5, {capture: true, once: true}
// h1.addEventListener("click", function (e) {
//   console.log("Test 5: {capture: true, once: true}, expect once")
// }, {capture: true, once: true});
//
//
// //test 6: {once: false}, normal capture: false
//
// h1.addEventListener("click", function (e) {
//   console.log("Test 6: {once: true}, normal capture: false, expect once")
// }, {once: true}, false);
//
// // test 7: nested eventListeners 1
// h1.addEventListener("click", function () {
//   h1.addEventListener("keypress", function (e) {
//     console.log("Test 7 : nested eventListener: outer listener {once: true}, inner listener {once: true}, expect once")
//   }, {once: true});
//   h1.dispatchEvent(new KeyboardEvent("keypress"));
//   h1.dispatchEvent(new KeyboardEvent("keypress"));
// }, {once: true});
//
// // test 8: nested eventListeners 2
// h1.addEventListener("click", function () {
//   h1.addEventListener("keypress", function (e) {
//     console.log("Test 8 : nested eventListener: outer listener {once: true}, inner listener {once: false}, expect twice")
//   }, {once: false});
//   h1.dispatchEvent(new KeyboardEvent("keypress"));
//   h1.dispatchEvent(new KeyboardEvent("keypress"));
// }, {once: true});
//
//
// // test 9: nested eventListeners 3
// h1.addEventListener("click", function () {
//   h1.addEventListener("keydown", function (e) {
//     console.log("Test 9 : nested eventListener: outer listener {once: true}, inner listener {once: false}, expect twice")
//   }, {once: true});
//   h1.dispatchEvent(new KeyboardEvent("keydown"));
//   h1.dispatchEvent(new KeyboardEvent("keydown"));
// }, {once: false});
//
// // test 10: outer callback function
// h1.addEventListener("click", () => {
//   funkyBoy("Test 10: outer function, expected once")
// }, {once: true});
//
// // test 11:
// let opts = {once: false};
//
// h1.addEventListener("click", () => {
//   funkyBoy("Test 11: removeEventListener() {once: false}, expect twice");
// }, opts)
//
// opts = {once: true}
//
// h1.addEventListener("click", () => {
//   funkyBoy("Test 11: removeEventListener() {once: true}, expect once");
// }, opts)
//
// // test 12:
// const listener = function (e) {
//   console.log("Test 12: redefine {once}, expected once")
// };
// h1.addEventListener("click", listener, {once: false});
// h1.removeEventListener("click", listener, {once: false});
// h1.addEventListener("click", listener, {once: true});
//
// test
// 13
// :
//
//
// // debugger
//
// h1.addEventListener("click", () => playBoy("Test 14: add the same event listener twice, expected once"), {once: true});
// h1.addEventListener("click", () => playBoy("Test 14: add the same event listener twice, expected once"), {once: true});
//
//
// h1.dispatchEvent(new MouseEvent("click"));
// h1.dispatchEvent(new MouseEvent("click"));
//
let i = 0;

function useCase(){
  class WebComp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<h1>hello sunshine!</h1>`
    }
  }

  const name = "web-comp-" + i++;
  customElements.define(name, WebComp);
  return document.createElement(name);
}

let res;
export const testBasic = [{
  name: "target only (addEventListener with different options, not connected to the DOM, called twice)",
  fun: function (res) {
    // //res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res.push("a");
    });
    h1.addEventListener("click", function (e) {
      res.push("b");
    }, {});
    h1.addEventListener("click", function (e) {
      res.push("c");
    }, true);
    h1.addEventListener("click", function (e) {
      res.push("d");
    }, false);
    h1.addEventListener("click", function (e) {
      res.push("e");
    }, {capture: true});
    h1.addEventListener("click", function (e) {
      res.push("f");
    }, {capture: false});
    h1.addEventListener("click", function (e) {
      res.push("g");
    }, {capture: "omg"});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "abcdefgabcdefg",
  result: function () {
    return res;
  }
}, {
  name: "removeEventListener",
  fun: function(res){
    //res = "";
    const h1 = document.createElement("h1");

    function cb(e) {
      res.push("omg");
    }

    h1.addEventListener("click", cb, {});
    h1.removeEventListener("click", cb, {});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "",
  result: function () {
    return res;
  }
}, {
  name: "removeEventListener and add it again",
  fun: function(res){
    //res = "";
    const h1 = document.createElement("h1");

    function cb(e) {
      res.push("c");
    }

    h1.addEventListener("click", cb);
    h1.removeEventListener("click", cb);
    h1.addEventListener("click", cb);
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "c",
  result: function () {
    return res;
  }
}, {
  name: "simple capture, at_target, bubble",
  fun: function(res){
    //res = "";
    const h1 = document.createElement("h1");
    const h2 = document.createElement("h2");
    h1.appendChild(h2);

    function cb(e) {
      res.push(e.eventPhase);
    }

    h1.addEventListener("click", cb);
    h1.addEventListener("click", cb, true);
    h2.addEventListener("click", cb);
    h2.addEventListener("click", cb, true);
    h2.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: "1223",
  result: function () {
    return res;
  }
}, {
  name: "basic: at_target order differ host/end target",
  fun: function(res){
    //res = "";
    const webComp = useCase();

    function cbCapture(e) {
      res.push(e.eventPhase + "-");
    }
    function cbBubble(e) {
      res.push(e.eventPhase + "+");
    }

    webComp.addEventListener("click", cbBubble);
    webComp.addEventListener("click", cbCapture, true);
    webComp.shadowRoot.addEventListener("click", cbBubble);
    webComp.shadowRoot.addEventListener("click", cbCapture, true);
    webComp.shadowRoot.children[0].addEventListener("click", cbBubble);
    webComp.shadowRoot.children[0].addEventListener("click", cbCapture, true);
    webComp.shadowRoot.children[0].dispatchEvent(new Event("click", {bubbles: true, composed: true}));
  },
  expect: "2-1-2+2-3+2+",
  result: function () {
    return res;
  }
}];