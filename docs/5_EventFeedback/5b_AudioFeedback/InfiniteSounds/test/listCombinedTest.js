import {parse} from "../Parser.js";

describe('[ outside, : inside', function () {

  it("[1:2,3]", function () {
    const tst = parse('[1:2,3]');
    const result = [
      [1, 2],
      3
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2:3,4]", function () {
    const tst = parse('[1:2:3,4]');
    const result = [
      [1, 2, 3],
      4
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2:3,4]", function () {
    const tst = parse('[1,2:3,4]');
    const result = [
      1,
      [2, 3],
      4
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2,3:4]", function () {
    const tst = parse('[1:2,3:4]');
    const result = [
      [1, 2],
      [3, 4]
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2:,4]", function () {
    try {
      const tst = parse('[1:2:,4]');
    } catch (e) {
      expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    }
  });
});

describe(': outside, [ inside', function () {

  it("1:[2,3]", function () {
    const tst = parse('1:[2,3]');
    const result = [
      1,
      [2, 3]
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2]:3", function () {
    const tst = parse('[1,2]:3');
    const result = [
      [1, 2],
      3
    ];
    expect(tst).to.deep.equal(result);
  });
  it("1:2:[3,4]", function () {
    const tst = parse('1:2:[3,4]');
    const result = [
      1, 2,
      [3, 4]
    ];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2]:3:4", function () {
    const tst = parse('[1,2]:3:4');
    const result = [
      [1, 2],
      3,
      4
    ];
    expect(tst).to.deep.equal(result);
  });
  it("1:[2,3]:4", function () {
    const tst = parse('1:[2,3]:4');
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
    const tst = parse('x > y > [z, q]');
    const result = {
      type: ">",
      args: [{
        "type": "x"
      },
        {"type": "y"},
        [
          {"type": "z"},
          {"type": "q"}
        ]]
    };
    expect(tst).to.deep.equal(result);
  });
  it("x > (y > c)", function () {
    const tst = parse('x > (y > z)');
    const res = {
      type: ">",
      args: [{
        type: "x",
      }, {
        type: ">",
        args: [{
          type: "y",
        }, {
          type: "z",
        }]
      }]
    };
    expect(tst).to.deep.equal(res);
  });
});
describe('| and > combined', function () {

  it("1 | 2 > 3", function () {
    const tst = parse('1 | 2 > 3');
    const tst2 = parse('1 | (2 > 3)');
    const result = {
      type: "|",
      args: [
        1,
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
    expect(tst2).to.deep.equal(result);
  });

  it("1 > 2 | 3", function () {
    const tst = parse('1 > 2 | 3');
    const tst2 = parse('(1 > 2) | 3');
    const result = {
      type: "|",
      args: [
        {
          type: ">",
          args: [
            1,
            2
          ]
        },
        3
      ]
    };
    expect(tst).to.deep.equal(result);
    expect(tst2).to.deep.equal(result);
  });

  it("1 > {2 | 3}", function () {
    const tst = parse('1 > {2 | 3}');
    const result = {
      type: ">",
      args: [
        1,
        {
          type: "|",
          args: [
            2,
            3
          ]
        }
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("{1 | 2} > 3", function () {
    const tst = parse('{1 | 2} > 3');
    const result = {
      type: ">",
      args: [
        {
          type: "|",
          args: [
            1,
            2
          ]
        },
        3
      ]
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('ALL combined', function () {

  it("[1:2,] | 3 > 4", function () {
    const tst = parse('[1:2,] | 3 > 4');
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
    const tst = parse('[1:2,] | 3 > 4');
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
    const tst = parse('1 | 2 > [3, 4:5]');
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
    const tst = parse('1 | 2 > [3, 4:5, ] > 6 | 7');
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
      const tst = parse('[1:2:,4]');
    } catch (e) {
      expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    }
  });
});

