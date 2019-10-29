import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('expressionFunctions basic', function () {
  it("expressionFunction: 1+2(3+4)", async function () {
    const tst = parse("1+2(3+4)");
    const res = {
      type: "expFun",
      body: [
        {type: "+", body: [1, 2]},
        {type: "+", body: [3, 4]},
      ]
    };
    res.body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
  });
  it("expressionFunction: 1+2(3)", async function () {
    const tst = parse("1+2(3)");
    const res = {
      type: "expFun",
      body: [
        {type: "+", body: [1, 2]},
        3
      ]
    };
    res.body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
  });
});

describe('expressionFunction: static interpret', function () {
  it("1+2(3+4)", async function () {
    const tst2 = await staticInterpret("1+2(3+4)");
    const res2 = {
      type: "expFun",
      body: [
        3,
        7,
      ]
    };
    expectToEqualWithDiff(tst2, res2);
  });
});