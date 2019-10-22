import {parse} from "../Parser2.js";
import {staticInterpret} from "../Interpreter3.js";

describe('quotes', function () {
  it("'hello world!'", function () {
    const tst = parse("'hello world!'");
    expect(tst).to.deep.equal("hello world!");
  });

  it('"hello world!"', function () {
    const tst = parse('"hello world!"');
    expect(tst).to.deep.equal("hello world!");
  });

  it('"hello \\\"world!"', function () {
    const tst = parse('"hello \\\"world!"');
    expect(tst).to.be.equal("hello \\\"world!");
  });
  it('"hello \\\\\\\"world!"', function () {
    const tst = parse('"hello \\\\\\\"world!"');
    expect(tst).to.deep.equal("hello \\\\\\\"world!");
  });
});

describe('numbers', function () {
  it("OK: 12", function () {
    const tst = parse('12');
    expect(tst).to.be.equal(12);
  });

  it("OK: 12hz", function () {
    const tst = parse('12hz');
    const result = {body: 12, type: "hz"};
    expect(tst).to.deep.equal(result);
  });

  it("OK: 1+2", function () {
    const tst = parse('1+2');
    const result = {
      type: "+",
      body: [1, 2]
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('primitive arrays', function () {
  it("[1,2,, 'hello']", function () {
    const tst = parse('[1,2,, \'hello\']');
    expect(tst).to.deep.equal([1,2,undefined, "hello"]);
    expect(tst.isPrimitive).to.be.equal(1);
  });
  it("[1,[2,], 'hello']", function () {
    const tst = parse('[1,[2,], \'hello\']');
    expect(tst).to.deep.equal([1,[2,undefined], "hello"]);
    expect(tst.isPrimitive).to.be.equal(1);
    expect(tst[1].isPrimitive).to.be.equal(1);
  });
  it("[1,[2+3,], 'hello']", async function () {
    const tst = await staticInterpret('[1,[2+3,], \'hello\']');
    expect(tst).to.deep.equal([1,[5,undefined], "hello"]);
    expect(tst.isPrimitive).to.be.equal(1);
    expect(tst[1].isPrimitive).to.be.equal(1);
  });
});

describe("Matches Java and JavaScript numbers (except Infinity and NaN)", function () {
  it("integers and float", function () {
    expect(parse("0")).to.be.equal(0);
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
  it("postfix minus/pluss", function () {
    expect(parse("1-")).to.deep.equal({type: "-", body: [1, undefined]});
    expect(parse("1+")).to.deep.equal({type: "+", body: [1, undefined]});
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

describe("expression test: 0+1", function () {
  it("0+1", function () {
    const tst = parse('0+1');
    const result = {
      type: "+",
      body: [0, 1]
    };
    expect(tst).to.deep.equal(result);
  });
});

describe("Comma and operators", function () {

  it("[1+1,2+2,3+3] - syntax interpreted", function () {
    const tst2 = parse('[1+1,2+2,3+3]');
    const result2 = [{
      type: "+",
      body: [1, 1]
    }, {
      type: "+",
      body: [2, 2]
    }, {
      type: "+",
      body: [3, 3]
    }];
    expect(tst2).to.deep.equal(result2);
  });
});

