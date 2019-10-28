import {staticInterpret} from "../Interpreter.js";

describe('[ outside, : inside', function () {

  it("[1:2,3]", async function () {
    const tst = await staticInterpret('[1:2,3]');
    const result = [[1, 2], 3];
    expectToEqualWithDiff(tst, result);
  });
  it("[1:2:3,4]", async function () {
    const tst = await staticInterpret('[1:2:3,4]');
    const result = [[1, 2, 3], 4];
    expectToEqualWithDiff(tst, result);
  });
  it("[1,2:3,4]", async function () {
    const tst = await staticInterpret('[1,2:3,4]');
    const result = [1, [2, 3], 4];
    expectToEqualWithDiff(tst, result);
  });
  it("[1:2,3:4]", async function () {
    const tst = await staticInterpret('[1:2,3:4]');
    const result = [[1, 2], [3, 4]];
    expectToEqualWithDiff(tst, result);
  });
  it("[1:2:,4]", async function () {
    // try {
    const tst = await staticInterpret('[1:2:,4]');
    const result = [[1, 2, undefined], 4];
    expectToEqualWithDiff(tst, result);
    // } catch (e) {
    //   expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    // }
  });
});

describe(': outside, [ inside', function () {

  it("1:[2,3]", async function () {
    const tst = await staticInterpret('1:[2,3]');
    const result = [1, [2, 3]];
    expectToEqualWithDiff(tst, result);
  });
  it("[1,2]:3", async function () {
    const tst = await staticInterpret('[1,2]:3');
    const result = [[1, 2], 3];
    expectToEqualWithDiff(tst, result);
  });
  it("1:2:[3,4]", async function () {
    const tst = await staticInterpret('1:2:[3,4]');
    const result = [1, 2, [3, 4]];
    expectToEqualWithDiff(tst, result);
  });
  it("[1,2]:3:4", async function () {
    const tst = await staticInterpret('[1,2]:3:4');
    const result = [[1, 2], 3, 4];
    expectToEqualWithDiff(tst, result);
  });
  it("1:[2,3]:4", async function () {
    const tst = await staticInterpret('1:[2,3]:4');
    const result = [1, [2, 3], 4];
    expectToEqualWithDiff(tst, result);
  });
});

describe('> combined with array [...] and group (...)', function () {
  it("x > y > [z, q]", async function () {
    const tst = await staticInterpret('x > y > [z, q]');
    const result = {
      type: ">",
      body: [
        {
          type: ">",
          body: [{type: "x", body: []}, {type: "y", body: []}]
        },
        [
          {type: "z", body: []},
          {type: "q", body: []}
        ]
      ]
    };
    // debugger;
    result.body.isDirty = 1;
    result.body[0].body.isDirty = 1;
    result.body[1].isDirty = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("x > (y > z)", async function () {
    const tst = await staticInterpret('x > (y > z)');
    const res = {
      type: ">",
      body: [
        {type: "x", body: []},
        {
          type: ">",
          body: [{type: "y", body: []}, {type: "z", body: []}]
        }
      ]
    };
    res.body.isDirty = 1;
    res.body[1].body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
  });
});
describe('| and > combined', function () {

  it("1 | 2 > 3", async function () {
    const tst = await staticInterpret('1 | 2 > 3');
    const result = [1, {
      type: ">",
      body: [2, 3]
    }];
    result.isDirty = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("1 | (2 > 3)", async function () {
    const tst2 = await staticInterpret('1 | (2 > 3)');
    const result = [1, {
      type: ">",
      body: [2, 3]
    }];
    result.isDirty = 1;
    expectToEqualWithDiff(tst2, result);
  });

  it("1 > 2 | 3", async function () {
    const tst = await staticInterpret('1 > 2 | 3');
    const result = [{
      type: ">",
      body: [1, 2]
    }, 3];
    result.isDirty = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("(1 > 2) | 3", async function () {
    const tst2 = await staticInterpret('(1 > 2) | 3');
    const res = [{
      type: ">",
      body: [1, 2]
    }, 3];
    res.isDirty = 1;
    expectToEqualWithDiff(tst2, res);
  });

});

describe('ALL combined', function () {

  it("[1:2,] | 3 > 4", async function () {
    const tst = await staticInterpret('[1:2,] | 3 > 4');
    const result = [[[1, 2], undefined], {
      type: ">",
      body: [3, 4]
    }];
    result.isDirty = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("1 | 2 > [3, 4:5]", async function () {
    const tst = await staticInterpret('1 | 2 > [3, 4:5]');
    const result = [
      1,
      {
        type: ">",
        body: [
          2,
          [
            3,
            [4, 5]
          ]
        ]
      }];
    result.isDirty = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("1 | 2 > [3, 4:5, ] > 6 | 7", async function () {
    const tst = await staticInterpret('1 | 2 > [3, 4:5, ] > 6 | 7');
    const result = [1, {
      type: ">",
      body: [
        {
          type: ">",
          body: [2, [3, [4, 5], undefined]]
        },
        6
      ]
    }, 7];
    result.isDirty = 1;
    result[1].body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
  });
});

describe('errors', function () {
  it("missing ] end", async function () {
    let tst;
    try {
      tst = await staticInterpret('[[1,2,3,]');
    } catch (e) {
      expectToEqualWithDiff(e.message, "Forgot to close [-block.");
      return;
    }
    expect(true).toBe(false);
  });
  it("missing ) end", async function () {
    let tst;
    try {
      tst = await staticInterpret('((1)');
    } catch (e) {
      expectToEqualWithDiff(e.message, "Forgot to close (-block.");
      return;
    }
    expect(true).toBe(false);
  });
});

