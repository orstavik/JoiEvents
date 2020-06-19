let res;

export const firstTest = [{
  name: "first is true: {first: true, capture: true}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    });
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: true, capture: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba",result: function(){return res;
  }
}, {
  name: "first is true: {first: 1}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {capture: true});
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {first: 1, capture: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ab",result: function(){return res;
  }
}, {
  name: "first is true: {first: []}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {capture: true});
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: [], capture: true});
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba",result: function(){return res;
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
  expect: "ab",result: function(){return res;
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
  expect: "ab",result: function(){return res;
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
  expect: "ab",result: function(){return res;
  }
  //todo move this into a test of both last_first
// }, {
//   name: "first on bubble and capture side {capture: true, first: true}",
//   fun: function () {
//     res = "";
//     const h1 = document.createElement("h1");
//     const span = document.createElement("span");
//     h1.appendChild(span);
//
//     h1.addEventListener("click", function (e) {
//       res += "a";
//     }, {capture: true});
//     h1.addEventListener("click", function (e) {
//       res += "b";
//     }, {capture: true, first: true});
//     h1.addEventListener("click", function (e) {
//       res += "c";
//     });
//     h1.addEventListener("click", function (e) {
//       res += "d";
//     }, {last: true});
//     span.dispatchEvent(new MouseEvent("click", {bubbles: true}));
//   },
//   expect: function () {
//     return res === "badc";
//   }
}, {
  name: "First: removeEventListener() {first: true, capture: true} and then define new first event listener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a() {
      res += "a";
    }

    h1.addEventListener("click", a, {first: true, capture: true});
    h1.removeEventListener("click", a, {capture: true});
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {first: true, capture: true});
    h1.dispatchEvent(new MouseEvent("click"))

  },
  expect: "b",result: function(){return res;
  }
}, {
  name: "First: removeEventListener() {first: true, capture: true} when there is no event listener to remove",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.removeEventListener("click", function (e) {
      res += "a";
    }, {first: true, capture: true});
  },
  expect: "",result: function(){return res;//todo we should somehow here check the first register.
  }
}];

export const firstErrorsTest = [{
  name: "First error: adding two first listeners",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    h1.addEventListener("click", function (e) {
      res += "a";
    }, {first: true, capture: true});
    try {
      h1.addEventListener("click", function (e) {
        res += "b";
      }, {first: true, capture: true});
    } catch (e) {
      res += "1";
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "1a",result: function(){return res;  // a at the end
  }
}, {
  name: "First error: first on bubble phase",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    try {
      h1.addEventListener("click", function (e) {
        res += "a";
      }, {first: true});
    } catch (e) {
      res += "1";
    }
    try {
      h1.addEventListener("click", function (e) {
        res += "b";
      }, {first: true, capture: false});
    } catch (e) {
      res += "2";
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "12",result: function(){return res;
  }
}];