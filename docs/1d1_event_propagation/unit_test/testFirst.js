let res;

export const firstTest = [{
  name: "first is true: {first: true}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    });
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: function () {
    return res === "ba";
  }
}, {
  name: "first is true: {first: 1}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {first: 1});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: function () {
    return res === "ab";
  }
}, {
  name: "first is true: {first: []}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    });
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: []});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: function () {
    return res === "ba";
  }
}, {
  name: "first is false: {first: false}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    });
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: false});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: function () {
    return res === "ab";
  }
}, {
  name: "first is false: {first: 0}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    });
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: 0});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: function () {
    return res === "ab";
  }
}, {
  name: "first is false: {first: ''}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    });
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: ''});
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: function () {
    return res === "ab";
  }
}, {
  name: "first on bubble and capture side {capture: true, first: true}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    const span = document.createElement("span");
    h1.appendChild(span);

    h1.addEventListener("click", function (e) {
      res += "a";
    }, {capture: true});
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {capture: true, first: true});
    h1.addEventListener("click", function (e) {
      res += "c";
    });
    h1.addEventListener("click", function (e) {
      res += "d";
    }, {first: true});
    span.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  },
  expect: function () {
    return res === "badc";
  }
}, {
  name: "First: removeEventListener() {first: true} and then define new first event listener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a() {
      res += "a";
    }

    h1.addEventListener("click", a, {first: true});
    h1.removeEventListener("click", a);
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: true});
    h1.dispatchEvent(new MouseEvent("click"))

  },
  expect: function () {
    return res === "b";
  }
}, {
  name: "First: removeEventListener() {first: true} when there is no event listener to remove",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.removeEventListener("click", function (e) {
      res += "a";
    });
  },
  expect: function () {
    return res === "";//todo we should somehow here check the first register.
  }
}];

export const firstErrorsTest = [{
  name: "First error: adding two first listeners",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    h1.addEventListener("click", function (e) {
      res += "a";
    }, {first: true});
    try {
      h1.addEventListener("click", function (e) {
        res += "b";
      }, {first: true});
    } catch (e) {
      res = e;
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: function () {
    return res === "Error: only one event listener {first: true} can be added to a target for the same event type and capture/bubble event phase.a";  // a at the end
  }
}];