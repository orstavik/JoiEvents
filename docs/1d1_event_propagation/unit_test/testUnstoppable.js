let res;
export const testUnstoppable = [{
  name: "unstoppable: basic test",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a(e) {
      e.stopImmediatePropagation();
    }
    function b(e) {
      res += "b";
    }

    h1.addEventListener("click", a);
    h1.addEventListener("click", b, {unstoppable: true});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: function () {
    return res === "b";
  }
}];