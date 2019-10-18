import {staticInterpret} from "../Interpreter3.js";

describe('[ outside, : inside', function () {

  it("[1:2,3]", function () {
    const tst = staticInterpret('[1:2,3]');
    const result = [[1, 2], 3];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2:3,4]", function () {
    const tst = staticInterpret('[1:2:3,4]');
    const result = [[1, 2, 3], 4];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2:3,4]", function () {
    const tst = staticInterpret('[1,2:3,4]');
    const result = [1, [2, 3], 4];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2,3:4]", function () {
    const tst = staticInterpret('[1:2,3:4]');
    const result = [[1, 2], [3, 4]];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2:,4]", function () {
    try {
      const tst = staticInterpret('[1:2:,4]');
    } catch (e) {
      expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    }
  });
});

describe(': outside, [ inside', function () {

  it("1:[2,3]", function () {
    const tst = staticInterpret('1:[2,3]');
    const result = [
      1,
      [2, 3]
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2]:3", function () {
    const tst = staticInterpret('[1,2]:3');
    const result = [
      [1, 2],
      3
    ];
    expect(tst).to.deep.equal(result);
  });
  it("1:2:[3,4]", function () {
    const tst = staticInterpret('1:2:[3,4]');
    const result = [
      1, 2,
      [3, 4]
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2]:3:4", function () {
    const tst = staticInterpret('[1,2]:3:4');
    const result = [
      [1, 2],
      3,
      4
    ];
    expect(tst).to.deep.equal(result);
  });
  it("1:[2,3]:4", function () {
    const tst = staticInterpret('1:[2,3]:4');
    const result = [
      1,
      [2, 3],
      4
    ];
    expect(tst).to.deep.equal(result);
  });
});

describe('> combined with array [...] and group (...)', function () {
  it("x > y > [z, q]", function () {
    const tst = staticInterpret('x > y > [z, q]');
    const result = {
      type: ">",
      left: {"type": "x"},
      right: {
        type: ">",
        left: {"type": "y"},
        right: [
          {"type": "z"},

          {"type": "q"}]
      }
    };
    expect(tst).to.deep.equal(result);
  });
  it("x > (y > c)", function () {
    const tst = staticInterpret('x > (y > z)');
    const res = {
      type: ">",
      left: {"type": "x"},
      right: {
        type: "()",
        body: [{
          type: ">",
          left: {"type": "y"},
          right: {"type": "z"}
        }]
      }
    };
    expect(tst).to.deep.equal(res);
  });
});
describe('| and > combined', function () {

  it("1 | 2 > 3", function () {
    const tst = staticInterpret('1 | 2 > 3');
    const result = {
      type: "|",
      left: 1,
      right: {
        type: ">",
        left: 2,
        right: 3
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("1 | (2 > 3)", function () {
    const tst2 = staticInterpret('1 | (2 > 3)');
    const res = {
      type: "|",
      left: 1,
      right: {
        type: "()",
        body: [{
          type: ">",
          left: 2,
          right: 3
        }]
      }
    };
    expect(tst2).to.deep.equal(res);
  });

  it("1 > 2 | 3", function () {
    const tst = staticInterpret('1 > 2 | 3');
    const result = {
      type: ">",
      left: 1,
      right: {
        type: "|",
        left: 2,
        right: 3
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("(1 > 2) | 3", function () {
    const tst2 = staticInterpret('(1 > 2) | 3');
    const res = {
      type: "|",
      left: {
        type: "()",
        body: [{
          type: ">",
          left: 1,
          right: 2
        }]
      },
      right: 3
    };
    expect(tst2).to.deep.equal(res);
  });

});

describe('ALL combined', function () {

  it("[1:2,] | 3 > 4", function () {
    const tst = staticInterpret('[1:2,] | 3 > 4');
    const result = {
      type: "|",
      args: [
        [
          [1, 2],
          null
        ],
        {
          type: ">",
          args: [
            2,
            3
          ]
        }
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("[1:2,] > 3 | 4", function () {
    const tst = staticInterpret('[1:2,] | 3 > 4');
    const result = {
      type: "|",
      args: [
        [
          [1, 2],
          null
        ],
        {
          type: ">",
          args: [
            2,
            3
          ]
        }
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("1 | 2 > [3, 4:5]", function () {
    const tst = staticInterpret('1 | 2 > [3, 4:5]');
    const result = {
      type: "|",
      args: [
        1,
        {
          type: ">",
          args: [
            2,
            [3,
              [4, 5]
            ]
          ]
        }
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("1 | 2 > [3, 4:5, ] > 6 | 7", function () {
    const tst = staticInterpret('1 | 2 > [3, 4:5, ] > 6 | 7');
    const result = {
      type: "|",
      args: [
        1,
        {
          type: ">",
          args: [
            2,
            [
              3,
              [4, 5],
              null
            ],
            6
          ]
        },
        7
      ]
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('errors', function () {
  it("[1:2:,4]", function () {
    try {
      const tst = staticInterpret('[1:2:,4]');
    } catch (e) {
      expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    }
  });
});

