import {staticInterpret} from "../Interpreter.js";

describe('basic math', function () {

  it("1-1 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('1-1');
    expectToEqualWithDiff(tst2, 0);
  });

  it("[1+1,2+2,3+3] - syntax interpreted", async function () {
    const tst2 = await staticInterpret('[1+1,2+2,3+3]');
    expectToEqualWithDiff(tst2, [2, 4, 6]);
  });

  it("[1-1,2*2,9/3, 2^4] - syntax interpreted", async function () {
    const tst2 = await staticInterpret('[1-1,2*2,9/3, 2^4]');
    expectToEqualWithDiff(tst2, [0, 4, 3, 16]);
  });


  // it("3^*3 - syntax interpreted", async function () {
  //   const tst2 = await staticInterpret('3^*3');
  //   expectToEqualWithDiff(tst2, 3 * Math.pow(1.5, 3));
  // });

  it("0+1 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('0+1');
    expectToEqualWithDiff(tst2, 1);
  });
});

describe('musical operators as math', function () {
  it("440^^2 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('440^^2');
    expectToEqualWithDiff(tst2, 1760);
  });
  it("440^^-2 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('440^^-2');
    expectToEqualWithDiff(tst2, 110);
  });
  it("440^^0 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('440^^0');
    expectToEqualWithDiff(tst2, 440);
  });
  it("440^^3 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('440^^3');
    expectToEqualWithDiff(tst2, 3520);
  });
  it("440^^4 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('440^^4');
    expectToEqualWithDiff(tst2, 7040);
  });

  it("261.63^/0 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('261.63^/0');
    expectToEqualWithDiff(Math.round(tst2 * 100) / 100, 261.63);
  });
  it("261.63^/1 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('261.63^/1');
    expectToEqualWithDiff(Math.round(tst2 * 100) / 100, 392.00);
  });
  it("261.63^/2 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('261.63^/2');
    expectToEqualWithDiff(Math.round(tst2 * 100) / 100, 587.34);
  });
  it("261.63^/-1 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('261.63^/-1');
    expectToEqualWithDiff(Math.round(tst2 * 100) / 100, 174.62);
  });
  it("261.63^/-2 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('261.63^/-2');
    expectToEqualWithDiff(Math.round(tst2 * 100) / 100, 116.54);
  });
});

describe('math priority', function () {

  it("1-1*0+5 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('1-1*0+5');
    expectToEqualWithDiff(tst2, 1 - 1 * 0 + 5);
  });

  it("1+3/2-9-13 - syntax interpreted", async function () {
    const tst2 = await staticInterpret('1+3/2-9-13');
    expectToEqualWithDiff(tst2, 1 + 3 / 2 - 9 - 13);
  });
});

