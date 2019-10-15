import {parse} from "../Parser2.js";

describe('numbers', function () {
  it("OK: 12", function () {
    const tst = parse('12');
    const result = 12;
    expect(tst).to.be.equal(result);
  });

  it("Error: 12d12", function (done) {
    try {
      const tst = parse('12d12');
    } catch (e) {
      expect(e.message).to.deep.equal("the main css audio pipe is broken");
      done();
    }
  });
});