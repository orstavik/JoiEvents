import {parse} from "../Parser2.js";

describe('basic implied', function () {
  it("x > y > z", function () {
    const tst = parse('x > y > z');
    const result = {
      type: ">",
      left: {type: "x"},
      right: {
        type: ">",
        left: {type: "y"},
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | y | z", function () {
    const tst = parse('x | y | z');
    const result = {
      type: "|",
      left: {type: "x"},
      right: {
        type: "|",
        left: {type: "y"},
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x:y:z", function () {
    const tst = parse('x:y:z');
    const result = {
      type: ":",
      left: {type: "x"},
      right: {
        type: ":",
        left: {type: "y"},
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('basic wrapped', function () {
  it("(x > y > z)", function () {
    const tst = parse('(x > y > z)');
    const result = {
      type: "()",
      body: {
        type: ">",
        left: {type: "x"},
        right: {
          type: ">",
          left: {type: "y"},
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("(x | y | z)", function () {
    const tst = parse('(x | y | z)');
    const result = {
      type: "()",
      body: {
        type: "|",
        left: {type: "x"},
        right: {
          type: "|",
          left: {type: "y"},
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("[x:y:z]", function () {
    const tst = parse('[x:y:z]');
    const result = {
      type: "[]",
      body: {
        type: ":",
        left: {type: "x"},
        right: {
          type: ":",
          left: {type: "y"},
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("[x,y,z]", function () {
    const tst = parse('[x,y,z]');
    const result = {
      type: "[]",
      body: {
        type: ",",
        left: {type: "x"},
        right: {
          type: ",",
          left: {type: "y"},
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("fn(x,y,z)", function () {
    const tst = parse('fn(x,y,z)');
    const result = {
      type: "fn",
      body: {
        type: "()",
        body: {
          type: ",",
          left: {type: "x"},
          right: {
            type: ",",
            left: {type: "y"},
            right: {type: "z"}
          }
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('missed arguments', function () {
  it("x > > z", function () {
    const tst = parse('x > > z');
    const result = {
      type: ">",
      left: {type: "x"},
      right: {
        type: ">",
        left: undefined,
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it(" > y > z", function () {
    const tst = parse(' > y > z');
    const result = {
      type: ">",
      left: undefined,
      right: {
        type: ">",
        left: {type: "y"},
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | | z", function () {
    const tst = parse('x | | z');
    const result = {
      type: "|",
      left: {type: "x"},
      right: {
        type: "|",
        left: undefined,
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x ||| z", function () {
    const tst = parse('x ||| z');
    const result = {
      type: "|",
      left: {type: "x"},
      right: {
        type: "|",
        left: undefined,
        right: {
          type: "|",
          left: undefined,
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it(" | y | z", function () {
    const tst = parse(' | y | z');
    const result = {
      type: "|",
      left: undefined,
      right: {
        type: "|",
        left: {type: "y"},
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | y ||||", function () {
    const tst = parse('x | y ||||');
    const result = {
      type: "|",
      left: {type: "x"},
      right: {
        type: "|",
        left: {type: "y"},
        right: {
          type: "|",
          left: undefined,
          right: {
            type: "|",
            left: undefined,
            right: {
              type: "|",
              left: undefined,
              right: undefined
            }
          }
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x::z", function () {
    const tst = parse('x::z');
    const result = {
      type: ":",
      left: {type: "x"},
      right: {
        type: ":",
        left: undefined,
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it(":y:z", function () {
    const tst = parse(':y:z');
    const result = {
      type: ":",
      left: undefined,
      right: {
        type: ":",
        left: {type: "y"},
        right: {type: "z"}
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("x:y:", function () {
    const tst = parse('x:y:');
    const result = {
      type: ":",
      left: {type: "x"},
      right: {
        type: ":",
        left: {type: "y"},
        right: undefined
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("[x,,z]", function () {
    const tst = parse('[x,,z]');
    const result = {
      type: "[]",
      body: {
        type: ",",
        left: {type: "x"},
        right: {
          type: ",",
          left: undefined,
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("[,y,z]", function () {
    const tst = parse('[,y,z]');
    const result = {
      type: "[]",
      body: {
        type: ",",
        left: undefined,
        right: {
          type: ",",
          left: {type: "y"},
          right: {type: "z"}
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("[x,y,]", function () {
    const tst = parse('[x,y,]');
    const result = {
      type: "[]",
      body: {
        type: ",",
        left: {type: "x"},
        right: {
          type: ",",
          left: {type: "y"},
          right: undefined
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("fn(x,,z)", function () {
    const tst = parse('fn(x,,z)');
    const result = {
      type: "fn",
      body: {
        type: "()",
        body: {
          type: ",",
          left: {type: "x"},
          right: {
            type: ",",
            left: undefined,
            right: {type: "z"}
          }
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("fn(,y,z)", function () {
    const tst = parse('fn(,y,z)');
    const result = {
      type: "fn",
      body: {
        type: "()",
        body: {
          type: ",",
          left: undefined,
          right: {
            type: ",",
            left: {type: "y"},
            right: {type: "z"}
          }
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("fn(x,y,)", function () {
    const tst = parse('fn(x,y,)');
    const result = {
      type: "fn",
      body: {
        type: "()",
        body: {
          type: ",",
          left: {type: "x"},
          right: {
            type: ",",
            left: {type: "y"},
            right: undefined
          }
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('should become errors in next pass?', function () {
  it(":y:z", function (done) {
    try {
      const tst = parse(':y:z');
    } catch (e) {
      //todo should this be a url?
      expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
      done();
    }
  });
  it("x:y:", function (done) {
    try {
      const tst = parse(':y:z');
    } catch (e) {
      //todo should this be a url?
      expect(e.message).to.deep.equal("Illegal end of colon implied list, missing final argument.");
      done();
    }
  });
});

