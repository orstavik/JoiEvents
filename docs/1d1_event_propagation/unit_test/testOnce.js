let res;
export const testOnce = [{
  name: "removeEventListener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function cb(e) {
      res += "omg";
    }

    h1.addEventListener("click", cb, {once: true});
    h1.removeEventListener("click", cb);
    h1.addEventListener("click", cb);
    h1.removeEventListener("click", cb, {once: true});
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: function () {
    return res === "";
  }
}, {
  name: "add two event listeners, one with once and one without",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function cb(e) {
      res += "c";
    }

    function cb2(e) {
      res += "d";
    }

    h1.addEventListener("click", cb);
    h1.addEventListener("click", cb, {once: true});
    h1.addEventListener("click", cb2, {once: true});
    h1.addEventListener("click", cb2);

    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
    h1.dispatchEvent(new Event("click", {bubbles: true}));
  },
  expect: function () {
    return res === "cdcc";
  }
}];