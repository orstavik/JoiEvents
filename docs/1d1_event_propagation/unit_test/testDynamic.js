let res;

//generic dynamic listener test
export const dynamicTest = [{
  name: "dynamic 1: add listener from listener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    h1.addEventListener("click", function () {
      res += "a"
      h1.addEventListener("keypress", function (e) {
        res += "b"
      });
      h1.dispatchEvent(new KeyboardEvent("keypress"));
    });

    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "ab",result: function(){return res;
  }
}, {
  name: "dynamic 2: add listener from listener from listener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    h1.addEventListener("click", function () {
      res += "a";
      h1.addEventListener("keypress", function (e) {
        res += "b";
        h1.addEventListener("keyup", function (e) {
          res += "c"
        });
        h1.dispatchEvent(new KeyboardEvent("keyup"));

      });
      h1.dispatchEvent(new KeyboardEvent("keypress"));
    });
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "abc",result: function(){return res;
  }
}, {
  name: "dynamic 3: Remove listener from listener",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a() {
      res += "a";
    }

    function b() {
      res += "b";
    }

    h1.addEventListener("click", function () {
      h1.removeEventListener("click", b);
    });
    h1.addEventListener("click", a);
    h1.addEventListener("click", b);
    h1.dispatchEvent(new MouseEvent("click"))
  },
  expect: "a",result: function(){return res;
  }
}, {
  name: "dynamic 4: add event listeners",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a(e) {
      res += "a";
    }

    h1.addEventListener("click", function () {
      res += "x";
      h1.addEventListener("click", a);
    });

    h1.dispatchEvent(new MouseEvent("click"));
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "xxa",result: function(){return res;
  }
}, {
  name: "dynamic 5: add and remove event listeners",
  fun: function () {
    res = "";
    const h1 = document.createElement("h1");

    function a(e) {
      res += "a";
    }

    let x;
    h1.addEventListener("click", x = function () {
      res += "x";
      h1.removeEventListener("click", x);
      h1.addEventListener("click", a);
    });

    h1.dispatchEvent(new MouseEvent("click"));
    h1.dispatchEvent(new MouseEvent("click"));
  },
  expect: "xa",result: function(){return res;
  }
}];