import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('quotes', function () {
  it("'hello world!'", function () {
    const tst = parse("'hello world!'");
    expectToEqualWithDiff(tst, "hello world!");
  });

  it('"hello world!"', function () {
    const tst = parse('"hello world!"');
    expectToEqualWithDiff(tst, "hello world!");
  });

  it('"hello \\\"world!"', function () {
    const tst = parse('"hello \\\"world!"');
    expectToEqualWithDiff(tst, "hello \\\"world!");
  });
  it('"hello \\\\\\\"world!"', function () {
    const tst = parse('"hello \\\\\\\"world!"');
    expectToEqualWithDiff(tst, "hello \\\\\\\"world!");
  });
});

describe('names', function () {
  it("sine", function () {
    const tst = parse("sine");
    expectToEqualWithDiff(tst, {type: "sine", body: []});
  });
});

describe('numbers', function () {
  it("OK: 12", function () {
    const tst = parse('12');
    expectToEqualWithDiff(tst, 12);
  });

  it("OK: 1+2", function () {
    const tst = parse('1+2');
    const result = {
      type: "+",
      body: [1, 2]
    };
    expectToEqualWithDiff(tst, result);
  });
});

describe('primitive arrays', function () {
  it("[1,2,, 'hello']", function () {
    const tst = parse('[1,2,, \'hello\']');
    expectToEqualWithDiff(tst, [1, 2, undefined, "hello"]);
  });
  it("[1,[2,], 'hello']", function () {
    const tst = parse('[1,[2,], \'hello\']');
    expectToEqualWithDiff(tst, [1, [2, undefined], "hello"]);
  });
  it("[1,[2+3,], 'hello']", async function () {
    const tst = await staticInterpret('[1,[2+3,], \'hello\']');
    expectToEqualWithDiff(tst.body[0], [1, [5, undefined], "hello"]);
  });
});

describe("Matches Java and JavaScript numbers (except Infinity and NaN)", function () {
  it("integers and float", function () {
    expectToEqualWithDiff(parse("0"), 0);
    expectToEqualWithDiff(parse("1"), 1);
    expectToEqualWithDiff(parse("0.2"), 0.2);
    expectToEqualWithDiff(parse("-55"), -55);
    expectToEqualWithDiff(parse("-0.6"), -0.6);
  });
  it("numbers with e", function () {
    expectToEqualWithDiff(parse("88E8"), 88E8);
    expectToEqualWithDiff(parse("1e+24"), 1e+24);  // JavaScript-style
    expectToEqualWithDiff(parse("0.4E4"), 0.4E4);  // Java-style
    expectToEqualWithDiff(parse("-0.77E77"), -0.77E77);
  });
  it("Matches fractions with a leading decimal point", function () {
    expectToEqualWithDiff(parse(".3"), .3);
    expectToEqualWithDiff(parse("-.3"), -.3);
    expectToEqualWithDiff(parse(".3e-4"), .3e-4);
  });
  it("postfix minus/pluss", function () {
    expectToEqualWithDiff(parse("1-"), {type: "-", body: [1, undefined]});
    expectToEqualWithDiff(parse("1+"), {type: "+", body: [1, undefined]});
  });
  it("booleans", function () {
    expectToEqualWithDiff(parse("true"), true);
    expectToEqualWithDiff(parse("false"), false);
  });
  // it("possible errors", function () {
  //   expectToEqualWithDiff(parse(".")).(false);
  //   expectToEqualWithDiff(parse("9.")).(false);
  //   expectToEqualWithDiff(parse("1e+24.5")).(false);
  // });

  it("Error: 12d12", function (done) {
    try {
      const tst = parse('12d12');
    } catch (e) {
      expectToEqualWithDiff(e.message, "the main css audio pipe is broken");
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
    expectToEqualWithDiff(tst, result);
  });
});

describe("Comma and operators", function () {

  it("[1+1,2+2,3+3] - syntax interpreted", function () {
    const tst = parse('[1+1,2+2,3+3]');
    const res = {
      type: "[]",
      body: [{
        type: "+",
        body: [1, 1]
      }, {
        type: "+",
        body: [2, 2]
      }, {
        type: "+",
        body: [3, 3]
      }]
    };
    expectToEqualWithDiff(tst, res);
  });
});

