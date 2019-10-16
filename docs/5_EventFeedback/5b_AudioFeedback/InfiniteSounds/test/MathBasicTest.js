import {staticInterpret} from "../Interpreter3.js";

describe('basic math', function () {

  it("1-1 - syntax interpreted", function () {
    const tst2 = staticInterpret('1-1');
    expect(tst2).to.deep.equal(0);
  });

  it("[1+1,2+2,3+3] - syntax interpreted", function () {
    const tst2 = staticInterpret('[1+1,2+2,3+3]');
    expect(tst2).to.deep.equal([2, 4, 6]);
  });

  it("[1-1,2*2,9/3, 2^4] - syntax interpreted", function () {
    const tst2 = staticInterpret('[1-1,2*2,9/3, 2^4]');
    expect(tst2).to.deep.equal([0, 4, 3, 16]);
  });

  it("7^^5 - syntax interpreted", function () {
    const tst2 = staticInterpret('7^^5');
    expect(tst2).to.deep.equal(7 * Math.pow(2, 5));
  });

  it("3^*3 - syntax interpreted", function () {
    const tst2 = staticInterpret('3^*3');
    expect(tst2).to.deep.equal(3 * Math.pow(1.5, 3));
  });

  it("0+1 - syntax interpreted", function () {
    const tst2 = staticInterpret('0+1');
    expect(tst2).to.deep.equal(1);
  });
});

describe('math priority', function () {

  it("1-1*0+5 - syntax interpreted", function () {
    const tst2 = staticInterpret('1-1*0+5');
    expect(tst2).to.be.equal(1 - 1 * 0 + 5);
  });

  it("5-3/2+5 - syntax interpreted", function () {
    const tst2 = staticInterpret('5-3/2+5');
    expect(tst2).to.be.equal(5 - 3 / 2 + 5);
  });
});

