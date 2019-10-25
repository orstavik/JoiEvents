import {staticInterpret} from "../Interpreter3.js";

describe('[ outside, : inside', function () {

  it("[1:2,3]", async function () {
    const tst = await staticInterpret('[1:2,3]');
    const result = [[1, 2], 3];
    result[0][':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("[1:2:3,4]", async function () {
    const tst = await staticInterpret('[1:2:3,4]');
    const result = [[1, 2, 3], 4];
    result[0][':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("[1,2:3,4]", async function () {
    const tst = await staticInterpret('[1,2:3,4]');
    const result = [1, [2, 3], 4];
    result[1][':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("[1:2,3:4]", async function () {
    const tst = await staticInterpret('[1:2,3:4]');
    const result = [[1, 2], [3, 4]];
    result[0][':'] = 1;
    result[1][':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("[1:2:,4]", async function () {
    // try {
    const tst = await staticInterpret('[1:2:,4]');
    const result = [[1, 2, undefined], 4];
    result[0][':'] = 1;
    expectToEqualWithDiff(tst, result);
    // } catch (e) {
    //   expectToEqualWithDiff(e.message,"Illegal end of colon implied list: ','.");
    // }
  });
});

describe(': outside, [ inside', function () {

  it("1:[2,3]", async function () {
    const tst = await staticInterpret('1:[2,3]');
    const result = [1, [2, 3]];
    result[':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("[1,2]:3", async function () {
    const tst = await staticInterpret('[1,2]:3');
    const result = [[1, 2], 3];
    result[':'] = 1;
    expectToEqualWithDiff(tst, result);
    expectToEqualWithDiff(tst.isDirty, undefined);
    expectToEqualWithDiff(tst[0].isDirty, undefined);
  });
  it("1:2:[3,4]", async function () {
    const tst = await staticInterpret('1:2:[3,4]');
    const result = [1, 2, [3, 4]];
    result[':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("[1,2]:3:4", async function () {
    const tst = await staticInterpret('[1,2]:3:4');
    const result = [[1, 2], 3, 4];
    result[':'] = 1;
    expectToEqualWithDiff(tst, result);
  });
  it("1:[2,3]:4", async function () {
    const tst = await staticInterpret('1:[2,3]:4');
    const result = [1, [2, 3], 4];
    result[':'] = 1;
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
    result.body['isDirty'] = 1;
    result.body[0].body['isDirty'] = 1;
    result.body[1]['isDirty'] = 1;
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
    res.body['isDirty'] = 1;
    res.body[1].body['isDirty'] = 1;
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
    result['isDirty'] = 1;
    result['|'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("1 | (2 > 3)", async function () {
    const tst2 = await staticInterpret('1 | (2 > 3)');
    const res = [1, {
      type: ">",
      body: [2, 3]
    }];
    res['isDirty'] = 1;
    res['|'] = 1;
    expectToEqualWithDiff(tst2, res);
  });

  it("1 > 2 | 3", async function () {
    const tst = await staticInterpret('1 > 2 | 3');
    const result = [{
      type: ">",
      body: [1, 2]
    }, 3];
    result['isDirty'] = 1;
    result['|'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("(1 > 2) | 3", async function () {
    const tst2 = await staticInterpret('(1 > 2) | 3');
    const res = [{
      type: ">",
      body: [1, 2]
    }, 3];
    res['isDirty'] = 1;
    res['|'] = 1;
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
    result['isDirty'] = 1;
    result['|'] = 1;
    result[0][0][":"] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("1 | 2 > [3, 4:5]", async function () {
    const tst = await staticInterpret('1 | 2 > [3, 4:5]');
    const result = [1, {
      type: ">",
      body: [2, [3, [4, 5]]]
    }];
    result['isDirty'] = 1;
    result['|'] = 1;
    result[1].body[1][1][":"] =1;
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
    result['isDirty'] = 1;
    result['|'] = 1;
    result[1].body['isDirty']=1;
    result[1].body[0].body[1][1][":"] =1;
    expectToEqualWithDiff(tst, result);
  });
});

describe('errors', function () {
  it("missing ] end", async function () {
    let tst;
    try {
      tst = await staticInterpret('[[1,2,3,]');
    } catch (e) {
      expectToEqualWithDiff(e.message, "Forgot to close [-block.");
      // done();
    }
    expect(tst).toBe(undefined);
  });
  it("missing ) end", async function () {
    let tst;
    try {
      tst = await staticInterpret('((1)');
    } catch (e) {
      expectToEqualWithDiff(e.message, "Forgot to close (-block.");
      // done();
    }
    expect(tst).toBe(undefined);
  });
});
