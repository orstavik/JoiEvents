import {staticInterpret} from "../Interpreter.js";

describe('basic math: interpret', function () {

  it("1-1", async function () {
    const tst = await staticInterpret('1-1');
    expectToEqualWithDiff(tst.body[0], 0);
  });

  it("[1+1,2+2,3+3]", async function () {
    const tst = await staticInterpret('[1+1,2+2,3+3]');
    expectToEqualWithDiff(tst.body[0], [2, 4, 6]);
  });

  it("[1-1,2*2,9/3, 2^4]", async function () {
    const tst = await staticInterpret('[1-1,2*2,9/3, 2^4]');
    expectToEqualWithDiff(tst.body[0], [0, 4, 3, 16]);
  });


  // it("3^*3", async function () {
  //   const tst = await staticInterpret('3^*3');
  //   expectToEqualWithDiff(tst.body[0], 3 * Math.pow(1.5, 3));
  // });

  it("0+1", async function () {
    const tst = await staticInterpret('0+1');
    expectToEqualWithDiff(tst.body[0], 1);
  });
});

describe('musical operators as math: interpret', function () {
  it("440^^2", async function () {
    const tst = await staticInterpret('440^^2');
    expectToEqualWithDiff(tst.body[0], 1760);
  });
  it("440^^-2", async function () {
    const tst = await staticInterpret('440^^-2');
    expectToEqualWithDiff(tst.body[0], 110);
  });
  it("440^^0", async function () {
    const tst = await staticInterpret('440^^0');
    expectToEqualWithDiff(tst.body[0], 440);
  });
  it("440^^3", async function () {
    const tst = await staticInterpret('440^^3');
    expectToEqualWithDiff(tst.body[0], 3520);
  });
  it("440^^4", async function () {
    const tst = await staticInterpret('440^^4');
    expectToEqualWithDiff(tst.body[0], 7040);
  });

  it("261.63^/0", async function () {
    const tst = await staticInterpret('261.63^/0');
    expectToEqualWithDiff(Math.round(tst.body[0] * 100) / 100, 261.63);
  });
  it("261.63^/1", async function () {
    const tst = await staticInterpret('261.63^/1');
    expectToEqualWithDiff(Math.round(tst.body[0] * 100) / 100, 392.00);
  });
  it("261.63^/2", async function () {
    const tst = await staticInterpret('261.63^/2');
    expectToEqualWithDiff(Math.round(tst.body[0] * 100) / 100, 587.34);
  });
  it("261.63^/-1", async function () {
    const tst = await staticInterpret('261.63^/-1');
    expectToEqualWithDiff(Math.round(tst.body[0] * 100) / 100, 174.62);
  });
  it("261.63^/-2", async function () {
    const tst = await staticInterpret('261.63^/-2');
    expectToEqualWithDiff(Math.round(tst.body[0] * 100) / 100, 116.54);
  });
});

describe('math priority: interpret', function () {

  it("1-1*0+5", async function () {
    const tst = await staticInterpret('1-1*0+5');
    expectToEqualWithDiff(tst.body[0], 1 - 1 * 0 + 5);
  });

  it("1+3/2-9-13", async function () {
    const tst = await staticInterpret('1+3/2-9-13');
    expectToEqualWithDiff(tst.body[0], 1 + 3 / 2 - 9 - 13);
  });
  it("+2-3*3", async function () {
    const tst = await staticInterpret('+2-3*3');
    expectToEqualWithDiff(tst.body[0], +2 - 3 * 3);
  });
  it("+-3*3", async function () {
    const tst = await staticInterpret('+-3*3');
    expectToEqualWithDiff(tst.body[0], +-3 * 3);
  });
});

describe('math on arrays: interpret', function () {

  it("[13,27,31]+1", async function () {
    const tst2 = await staticInterpret('[13,27,31]+1',[]);
    expect([14, 28, 32]).toEqual(tst2.body[0]);
  });
});

