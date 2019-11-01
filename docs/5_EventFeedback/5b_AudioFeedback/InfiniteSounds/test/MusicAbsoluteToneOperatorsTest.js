import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('absNoteNum: multiplication *', function () {

  it("C#4lyd*2", async function () {
    const str = "C#4lyd*2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
        2
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [61, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd*-2", async function () {
    const str = "C#4lyd*-2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
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
  it("C#4lyd/4", async function () {
    const str = "C#4lyd/4";
    const tst = parse(str);
    const result = {
      type: "/",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
        4
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [25, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd/-4", async function () {
    const str = "C#4lyd/-4";
    const tst = parse(str);
    const result = {
      type: "/",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
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

describe('absNoteNum: + and - throws SyntaxError', function () {
  it("C#4lyd + 4", async function () {
    const str = "C#4lyd + 4";
    const tst = parse(str);
    const result = {
      type: "+",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
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

  it("C#4lyd - 4", async function () {
    const str = "C#4lyd - 4";
    const tst = parse(str);
    const result = {
      type: "-",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
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

describe('absNoteNum: ^^', function () {

  it("C#4lyd^^0", async function () {
    const str = "C#4lyd^^0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^2", async function () {
    const str = "C#4lyd^^2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49+24, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^-2", async function () {
    const str = "C#4lyd^^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-24, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^-3", async function () {
    const str = "C#4lyd^^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-36, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^-1", async function () {
    const str = "C#4lyd^^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-12, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('absNoteNum: ^/', function () {

  it("C#4lyd^/0", async function () {
    const str = "C#4lyd^/0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^/2", async function () {
    const str = "C#4lyd^/2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49+7*2, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^/-2", async function () {
    const str = "C#4lyd^/-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-7*2, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^/-3", async function () {
    const str = "C#4lyd^/-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-7*3, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^/-1", async function () {
    const str = "C#4lyd^/-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-7, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('absNoteNum: ^+', function () {

  it("C#4lyd^+0", async function () {
    const str = "C#4lyd^+0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^+2", async function () {
    const str = "C#4lyd^+2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49+2, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^-2", async function () {
    const str = "C#4lyd^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-2, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^-3", async function () {
    const str = "C#4lyd^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-3, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^-1", async function () {
    const str = "C#4lyd^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [49-1, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});