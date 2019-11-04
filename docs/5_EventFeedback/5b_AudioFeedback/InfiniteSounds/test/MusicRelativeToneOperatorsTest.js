import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('~Note: multiply *', function () {

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
    const result2 = {type: "Note", body: [0, 0, 12, 2, 0, 0]};
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

describe('~Note: division /', function () {
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
    const result2 = {type: "Note", body: [0, 0, -24, 2, 0, 0]};
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

describe('~Note: + and - throws SyntaxError', function () {
  it("~-2 + 4", async function () {
    const str = "~-2 + 4";
    const tst = parse(str);
    const result = {
      type: "+",
      body: [
        {type: "~", body: [undefined, -2]},
        4
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
    expect(res2.message).toBe("Notes cannot be added or subtracted. Use the ^+ or ^- or ~ to do note step operations.");
  });

  it("~-2 - 4", async function () {
    const str = "~-2 - 4";
    const tst = parse(str);
    const result = {
      type: "-",
      body: [
        {type: "~", body: [undefined, -2]},
        4
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
    expect(res2.message).toBe("Notes cannot be added or subtracted. Use the ^+ or ^- or ~ to do note step operations.");
  });
});

describe('~Note: ^^', function () {

  it("~3^^0", async function () {
    const str = "~3^^0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 0, 3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^2", async function () {
    const str = "~3^^2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 24, 3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^-1", async function () {
    const str = "~3^^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, -12, 3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^-2", async function () {
    const str = "~3^^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, -24, 3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^-3", async function () {
    const str = "~3^^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, -36, 3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('Note: ^+', function () {

  it("~5^+0", async function () {
    const str = "~5^+0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 0, 5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^+2", async function () {
    const str = "~5^+2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 2, 5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^-1", async function () {
    const str = "~5^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, -1, 5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^-2", async function () {
    const str = "~5^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, -2, 5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^-3", async function () {
    const str = "~5^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, -3, 5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('Note: %', function () {

  it("~6%0", async function () {
    const str = "~6%0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 0, 6, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~6%2", async function () {
    const str = "~6%2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 0, 6, 2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~6%-2", async function () {
    const str = "~6%-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, 0, 0, 6, -2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~6%lyd", async function () {
    const str = "~6%lyd";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, "lyd", 0, 6, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~6%2%ion", async function () {
    const str = "~6%2%ion";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, "ion", 0, 6, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~6%phr%-2", async function () {
    const str = "~6%phr%-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [0, "phr", 0, 6, -2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});