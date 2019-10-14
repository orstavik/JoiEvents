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

