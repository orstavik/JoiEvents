import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('relative notes */ num', function () {

  it("~2*2", async function () {
    const str = "~2*2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "~", body: [undefined, 2]},
        2
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [2, 1, 0]};
    expectToEqualWithDiff(tst2, result2);
  });

  it("~2*-2", async function () {
    const str = "~2*-2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "~", body: [undefined, 2]},
        -2
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    let res2;
    try {
      const tst2 = await staticInterpret(str);
    } catch (e) {
      res2 = e;
    }
    expect(res2).toBeInstanceOf(SyntaxError);
    expect(res2.message).toBe("Notes can only be multiplied/divided by positive integers in the log2 scale: 1,2,4,8,16,...");
  });
});

describe('absNoteNum: division /', function () {
  it("~2/4", async function () {
    const str = "~2/4";
    const tst = parse(str);
    const result = {
      type: "/",
      body: [
        {type: "~", body: [undefined, 2]},
        4
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [2, -2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~2/-4", async function () {
    const str = "~2/-4";
    const tst = parse(str);
    const result = {
      type: "/",
      body: [
        {type: "~", body: [undefined, 2]},
        -4
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    let res2;
    try {
      const tst2 = await staticInterpret(str);
    } catch (e) {
      res2 = e;
    }
    expect(res2).toBeInstanceOf(SyntaxError);
    expect(res2.message).toBe("Notes can only be multiplied/divided by positive integers in the log2 scale: 1,2,4,8,16,...");
  });
});