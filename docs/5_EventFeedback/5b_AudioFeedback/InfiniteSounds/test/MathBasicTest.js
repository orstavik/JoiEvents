import {staticInterpret} from "../Interpreter3.js";

describe('basic math', function () {

  it("[1+1,2+2,3+3] - syntax interpreted", function () {
    const tst2 = staticInterpret('[1+1,2+2,3+3]');
    const result2 = [2, 4, 9];
    expect(tst2).to.deep.equal(result2);
  });

});

