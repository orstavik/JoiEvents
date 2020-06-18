let res;

export const lastTest = [{
  name: "last is true: {last: true}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: true});
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba",result: function(){return res;
  }
}, {
  name: "last is true: {last: 1}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: 1});
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba",result: function(){return res;
  }
}, {
  name: "last is true: {last: []}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: []});
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ba",result: function(){return res;
  }
}, {
  name: "last is false: {last: false}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: false});
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab",result: function(){return res;
  }
}, {
  name: "last is false: {last: 0}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: 0});
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab",result: function(){return res;
  }
}, {
  name: "last is false: {last: ''}",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: ''});
    h1.addEventListener("click", function (e) {
      res += "b";
    });
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "ab",result: function(){return res;
  }
}, {
  name: "Last: removeEventListener() {last: true} and then define new last event listener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a(e) {
      res += "a";
    }

    h1.addEventListener("click", a, {last: true});
    h1.removeEventListener("click", a);
    h1.addEventListener("click", function (e) {
      res += "b";
    }, {last: true});
    h1.dispatchEvent(new MouseEvent("click"))

  },
  expect: "b",result: function(){return res;
  }
}, {
  name: "Last: removeEventListener() {last: true} when there is no event listener to remove",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");
    h1.removeEventListener("click", function (e) {
      res += "a";
    });
  },
  expect: "",result: function(){return res;//todo we should somehow here check the last register.
  }
}];

export const lastErrorsTest = [{
  name: "Last error: adding two last listeners",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    h1.addEventListener("click", function (e) {
      res += "a";
    }, {last: true});
    try {
      h1.addEventListener("click", function (e) {
        res += "b";
      }, {last: true});
    } catch (e) {
      res += "1";
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "1a",result: function(){return res;  // a at the end
  }
}, {
  name: "Last error: capture phase listener ",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    try {
      h1.addEventListener("click", function (e) {
        res += "a";
      }, {last: true, capture: true});
    } catch (e) {
      res += "1";
    }
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "1",result: function(){return res;
  }
}];