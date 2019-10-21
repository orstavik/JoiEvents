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
    expect(tst).to.deep.equal(result);
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
    expect(tst).to.deep.equal(res);
  });
});
describe('| and > combined', function () {

  it("1 | 2 > 3", async function () {
    const tst = await staticInterpret('1 | 2 > 3');
    const result = [1, {
      type: ">",
      body: [2, 3]
    }];
    expect(tst).to.deep.equal(result);
  });

  it("1 | (2 > 3)", async function () {
    const tst2 = await staticInterpret('1 | (2 > 3)');
    const res = [1, {
      type: ">",
      body: [2, 3]
    }];
    expect(tst2).to.deep.equal(res);
  });

  it("1 > 2 | 3", async function () {
    const tst = await staticInterpret('1 > 2 | 3');
    const result = [{
      type: ">",
      body: [1, 2]
    }, 3];
    expect(tst).to.deep.equal(result);
  });

  it("(1 > 2) | 3", async function () {
    const tst2 = await staticInterpret('(1 > 2) | 3');
    const res = [{
      type: ">",
      body: [1, 2]
    }, 3];
    expect(tst2).to.deep.equal(res);
  });

});

describe('ALL combined', function () {

  it("[1:2,] | 3 > 4", async function () {
    const tst = await staticInterpret('[1:2,] | 3 > 4');
    const result = [[[1, 2], undefined], {
      type: ">",
      body: [3, 4]
    }];
    expect(tst).to.deep.equal(result);
  });

  it("1 | 2 > [3, 4:5]", async function () {
    const tst = await staticInterpret('1 | 2 > [3, 4:5]');
    const result = [1, {
      type: ">",
      body: [2, [3, [4, 5]]]
    }];
    expect(tst).to.deep.equal(result);
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

