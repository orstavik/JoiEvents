import {parse} from "../Parser2.js";
import {staticInterpret} from "../Interpreter3.js";

describe('basic arrays', function () {

  it("x:y:z", function () {
    const tst = parse('x:y:z');
    const result = {
      type: ":",
      left: {
        type: ":",
        left: {type: "x", body: []},
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it("x:y:z - syntax interpreted", async function () {
    const tst2 = await staticInterpret('x:y:z');
    const result2 = [
      {type: "x", body: []},
      {type: "y", body: []},
      {type: "z", body: []}
    ];
    expect(tst2).to.deep.equal(result2);
  });

  it("[x,y,z]", function () {
    const tst = parse('[x,y,z]');
    const result = [
      {type: "x", body: []},
      {type: "y", body: []},
      {type: "z", body: []}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[x:y:z]", function (done) {
    const tst = parse('[x:y:z]');
    const result = [{
      type: ":",
      left: {
        type: ":",
        left: {type: "x", body: []},
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
    }];
    expect(tst).to.deep.equal(result);
    done();
  });

  it("[x:y:z] - syntax interpreted", async function () {
    const tst2 = await staticInterpret('[x:y:z]');
    const result2 = [
      [
        {type: "x", body: []},
        {type: "y", body: []},
        {type: "z", body: []}
      ]
    ];
    expect(tst2).to.deep.equal(result2);
  });

  it("[]", function () {
    const tst = parse('[]');
    expect(tst).to.deep.equal([]);
  });
});

describe('basic ()', function () {
  it("()", function () {
    const tst = parse('()');
    expect(tst).to.deep.equal(undefined);
  });
});

describe('basic pipe and bar', function () {
  it("x > y > z", function () {
    const tst = parse('x > y > z');
    const result = {
      type: ">",
      left: {
        type: ">",
        left: {type: "x", body: []},
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | y | z", function () {
    const tst = parse('x | y | z');
    const result = {
      type: "|",
      left: {
        type: "|",
        left: {type: "x", body: []},
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
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
        left: {
          type: ">",
          left: {type: "x", body: []},
          right: {type: "y", body: []}
        },
        right: {type: "z", body: []}
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
        left: {
          type: "|",
          left: {type: "x", body: []},
          right: {type: "y", body: []}
        },
        right: {type: "z", body: []}
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
          {type: "x", body: []},
          {type: "y", body: []},
          {type: "z", body: []}
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
      left: {
        type: ">",
        left: {type: "x", body: []},
        right: undefined
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it(" > y > z", function () {
    const tst = parse(' > y > z');
    const result = {
      type: ">",
      left: {
        type: ">",
        left: undefined,
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | | z", function () {
    const tst = parse('x | | z');
    const result = {
      type: "|",
      left: {
        type: "|",
        left: {type: "x", body: []},
        right: undefined
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it("x ||| z", function () {
    const tst = parse('x ||| z');
    const result = {
      type: "|",
      left: {
        type: "|",
        left: {
          type: "|",
          left: {type: "x", body: []},
          right: undefined
        },
        right: undefined
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it(" | y | z", function () {
    const tst = parse(' | y | z');
    const result = {
      type: "|",
      left: {
        type: "|",
        left: undefined,
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | y ||||", function () {
    const tst = parse('x | y ||||');
    const result = {
      type: "|",
      left: {
        type: "|",
        left: {
          type: "|",
          left: {
            type: "|",
            left: {
              type: "|",
              left: {type: "x", body: []},
              right: {type: "y", body: []}
            },
            right: undefined
          },
          right: undefined
        },
        right: undefined
      },
      right: undefined
    };
    expect(tst).to.deep.equal(result);
  });

  it("x::z", function () {
    const tst = parse('x::z');
    const result = {
      type: ":",
      left: {
        type: ":",
        left: {type: "x", body: []},
        right: undefined
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it(":y:z", function () {
    const tst = parse(':y:z');
    const result = {
      type: ":",
      left: {
        type: ":",
        left: undefined,
        right: {type: "y", body: []}
      },
      right: {type: "z", body: []}
    };
    expect(tst).to.deep.equal(result);
  });

  it("x:y:", function () {
    const tst = parse('x:y:');
    const result = {
      type: ":",
      left: {
        type: ":",
        left: {type: "x", body: []},
        right: {type: "y", body: []}
      },
      right: undefined
    };
    expect(tst).to.deep.equal(result);
  });

  it("[x,,z]", function () {
    const tst = parse('[x,,z]');
    const result = [
      {type: "x", body: []},
      undefined,
      {type: "z", body: []}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[,y,z]", function () {
    const tst = parse('[,y,z]');
    const result = [undefined,
      {type: "y", body: []},
      {type: "z", body: []}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[x,y,]", function () {
    const tst = parse('[x,y,]');
    const result = [
      {type: "x", body: []},
      {type: "y", body: []},
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
          {type: "x", body: []},
          undefined,
          {type: "z", body: []}
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
          {type: "y", body: []},
          {type: "z", body: []}
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
          {type: "x", body: []},
          {type: "y", body: []},
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

