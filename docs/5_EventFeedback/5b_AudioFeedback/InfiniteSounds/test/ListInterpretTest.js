import {staticInterpret} from "../Interpreter3.js";

describe('[ outside, : inside', function () {

  it("[1:2,3]", async function () {
    const tst = await staticInterpret('[1:2,3]');
    const result = [[1, 2], 3];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2:3,4]", async function () {
    const tst = await staticInterpret('[1:2:3,4]');
    const result = [[1, 2, 3], 4];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2:3,4]", async function () {
    const tst = await staticInterpret('[1,2:3,4]');
    const result = [1, [2, 3], 4];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2,3:4]", async function () {
    const tst = await staticInterpret('[1:2,3:4]');
    const result = [[1, 2], [3, 4]];
    expect(tst).to.deep.equal(result);
  });
  it("[1:2:,4]", async function () {
    // try {
    const tst = await staticInterpret('[1:2:,4]');
    const result = [[1, 2, undefined], 4];
    expect(tst).to.deep.equal(result);
    // } catch (e) {
    //   expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    // }
  });
});

describe(': outside, [ inside', function () {

  it("1:[2,3]", async function () {
    const tst = await staticInterpret('1:[2,3]');
    const result = [1, [2, 3]];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2]:3", async function () {
    const tst = await staticInterpret('[1,2]:3');
    const result = [[1, 2], 3];
    expect(tst).to.deep.equal(result);
  });
  it("1:2:[3,4]", async function () {
    const tst = await staticInterpret('1:2:[3,4]');
    const result = [1, 2, [3, 4]];
    expect(tst).to.deep.equal(result);
  });
  it("[1,2]:3:4", async function () {
    const tst = await staticInterpret('[1,2]:3:4');
    const result = [[1, 2], 3, 4];
    expect(tst).to.deep.equal(result);
  });
  it("1:[2,3]:4", async function () {
    const tst = await staticInterpret('1:[2,3]:4');
    const result = [1, [2, 3], 4];
    expect(tst).to.deep.equal(result);
  });
});

describe('> combined with array [...] and group (...)', function () {
  it("x > y > [z, q]", async function () {
    const tst = await staticInterpret('x > y > [z, q]');
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
  it("x > (y > c)", async function () {
    const tst = await staticInterpret('x > (y > z)');
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

  it("1 | 2 > 3", async function () {
    const tst = await staticInterpret('1 | 2 > 3');
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

  it("1 | (2 > 3)", async function () {
    const tst2 = await staticInterpret('1 | (2 > 3)');
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

  it("1 > 2 | 3", async function () {
    const tst = await staticInterpret('1 > 2 | 3');
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

  it("(1 > 2) | 3", async function () {
    const tst2 = await staticInterpret('(1 > 2) | 3');
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

  it("[1:2,] | 3 > 4", async function () {
    const tst = await staticInterpret('[1:2,] | 3 > 4');
    const result = {
      type: "|",
      left: [[1, 2], undefined],
      right: {
        type: ">",
        left: 3,
        right: 4
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("1 | 2 > [3, 4:5]", async function () {
    const tst = await staticInterpret('1 | 2 > [3, 4:5]');
    const result = {
      type: "|",
      left: 1,
      right: {
        type: ">",
        left: 2,
        right: [3, [4, 5]]
      }
    };
    expect(tst).to.deep.equal(result);
  });

  it("1 | 2 > [3, 4:5, ] > 6 | 7", async function () {
    const tst = await staticInterpret('1 | 2 > [3, 4:5, ] > 6 | 7');
    const result = {
      type: "|",
      left: 1,
      right: {
        type: ">",
        left: 2,
        right: {
          type: ">",
          left: [3, [4, 5], undefined],
          right: {
            type: "|",
            left: 6,
            right: 7
          }
        }
      }
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('errors', function () {
  it("missing ] end", async function () {
    let tst;
    try {
      tst = await staticInterpret('[[1,2,3,]');
    } catch (e) {
      expect(e.message).to.deep.equal("Forgot to close [-block.");
      // done();
    }
    assert(tst === undefined);
  });
  it("missing ) end", async function () {
    let tst;
    try {
      tst = await staticInterpret('((1)');
    } catch (e) {
      expect(e.message).to.deep.equal("Forgot to close (-block.");
      // done();
    }
    assert(tst === undefined);
  });
});

