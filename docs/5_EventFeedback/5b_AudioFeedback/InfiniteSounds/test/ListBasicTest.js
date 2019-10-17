import {parse} from "../Parser2.js";
import {interpretNode} from "../Interpreter3.js";
import {ListOps} from "../LibSyntax.js";

describe('basic arrays', function () {

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

  it("x:y:z - syntax interpreted", function () {
    const tst2 = interpretNode(parse('x:y:z'), ListOps);
    const result2 = [
      {type: "x"},
      {type: "y"},
      {type: "z"}
    ];
    expect(tst2).to.deep.equal(result2);
  });

  it("[x,y,z]", function () {
    const tst = parse('[x,y,z]');
    const result = [
      {type: "x"},
      {type: "y"},
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[x:y:z]", function () {
    const tst = parse('[x:y:z]');
    const result = [{
      type: ":",
      left: {type: "x"},
      right: {
        type: ":",
        left: {type: "y"},
        right: {type: "z"}
      }
    }
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[x:y:z] - syntax interpreted", function () {
    const tst2 = interpretNode(parse('[x:y:z]'), ListOps);
    const result2 = [
      [
        {type: "x"},
        {type: "y"},
        {type: "z"}
      ]
    ];
    expect(tst2).to.deep.equal(result2);
  });

  it("[]", function () {
    const tst = parse('[]');
    expect(tst).to.deep.equal([]);
  });
});

describe('basic pipe and bar', function () {
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
});

describe('basic wrapped', function () {
  it("(x > y > z)", function () {
    const tst = parse('(x > y > z)');
    const result = {
      type: "()",
      body: [{
        type: ">",
        left: {type: "x"},
        right: {
          type: ">",
          left: {type: "y"},
          right: {type: "z"}
        }
      }]
    };
    expect(tst).to.deep.equal(result);
  });

  it("(x | y | z)", function () {
    const tst = parse('(x | y | z)');
    const result = {
      type: "()",
      body: [{
        type: "|",
        left: {type: "x"},
        right: {
          type: "|",
          left: {type: "y"},
          right: {type: "z"}
        }
      }]
    };
    expect(tst).to.deep.equal(result);
  });

  it("fn(x,y,z)", function () {
    const tst = parse('fn(x,y,z)');
    const result = {
      type: "fn",
      body: {
        type: "()",
        body: [
          {type: "x"},
          {type: "y"},
          {type: "z"}
        ]
      }
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('missing arguments', function () {
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
    const result = [
      {type: "x"},
      undefined,
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[,y,z]", function () {
    const tst = parse('[,y,z]');
    const result = [undefined,
      {type: "y"},
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[x,y,]", function () {
    const tst = parse('[x,y,]');
    const result = [
      {type: "x"},
      {type: "y"},
      undefined
    ];
    expect(tst).to.deep.equal(result);
  });

  it("fn(x,,z)", function () {
    const tst = parse('fn(x,,z)');
    const result = {
      type: "fn",
      body: {
        type: "()",
        body: [
          {type: "x"},
          undefined,
          {type: "z"}
        ]
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
        body: [
          undefined,
          {type: "y"},
          {type: "z"}
        ]
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
        body: [
          {type: "x"},
          {type: "y"},
          undefined,
        ]
      }
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('todo: should these become errors in syntactic interpretation?', function () {
  it(":y:z", function (done) {
    // try {
    //   const tst = parse(':y:z');
    // } catch (e) {
    //  todo should this be a url?
    // expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    done();
    // }
  });
  it("x:y:", function (done) {
    // try {
    //   const tst = parse(':y:z');
    // } catch (e) {
    // expect(e.message).to.deep.equal("Illegal end of colon implied list, missing final argument.");
    done();
    // }
  });
});

