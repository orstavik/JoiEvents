import {parse} from "../Parser2.js";

describe('numbers', function () {
  it("OK: 12", function () {
    const tst = parse('12');
    const result = 12;
    expect(tst).to.be.equal(result);
  });

  it("OK: 12hz", function () {
    const tst = parse('12hz');
    const result = {num: 12, unit: "hz"};
    expect(tst).to.deep.equal(result);
  });

  it("OK: 1+2", function () {
    const tst = parse('1+2');
    const result = {
      type: "+",
      left: 1,
      right: 2
    };
    expect(tst).to.deep.equal(result);
  });
});

describe("Matches Java and JavaScript numbers (except Infinity and NaN)", function () {
  it("integers and float", function () {
    expect(parse("1")).to.be.equal(1);
    expect(parse("0.2")).to.be.equal(0.2);
    expect(parse("-55")).to.be.equal(-55);
    expect(parse("-0.6")).to.be.equal(-0.6);
  });
  it("numbers with e", function () {
    expect(parse("88E8")).to.be.equal(88E8);
    expect(parse("1e+24")).to.be.equal(1e+24);  // JavaScript-style
    expect(parse("0.4E4")).to.be.equal(0.4E4);  // Java-style
    expect(parse("-0.77E77")).to.be.equal(-0.77E77);
  });
  it("Matches fractions with a leading decimal point", function () {
    expect(parse(".3")).to.be.equal(.3);
    expect(parse("-.3")).to.be.equal(-.3);
    expect(parse(".3e-4")).to.be.equal(.3e-4);
  });
  // it("possible errors", function () {
  //   expect(parse(".")).to.be.equal(false);
  //   expect(parse("9.")).to.be.equal(false);
  //   expect(parse("1e+24.5")).to.be.equal(false);
  // });

  it("Error: 12d12", function (done) {
    try {
      const tst = parse('12d12');
    } catch (e) {
      expect(e.message).to.deep.equal("the main css audio pipe is broken");
      done();
    }
  });
});