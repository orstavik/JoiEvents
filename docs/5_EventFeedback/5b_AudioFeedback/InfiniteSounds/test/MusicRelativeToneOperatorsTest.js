import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('~relNote: multiply *', function () {

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

describe('~relNote: division /', function () {
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

describe('~relNote: + and - throws SyntaxError', function () {
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

describe('~relNote: ^^', function () {

  it("~3^^0", async function () {
    const str = "~3^^0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^2", async function () {
    const str = "~3^^2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [17, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^-1", async function () {
    const str = "~3^^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [-4, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^-2", async function () {
    const str = "~3^^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [-11, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^^-3", async function () {
    const str = "~3^^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [-18, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('relNote: ^/', function () {

  it("~3^/0", async function () {
    const str = "~3^/0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [3, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^/2", async function () {
    const str = "~3^/2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [11, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^/-2", async function () {
    const str = "~3^/-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [-5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^/-3", async function () {
    const str = "~3^/-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [-9, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~3^/-1", async function () {
    const str = "~3^/-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [-1, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});
describe('relNote: ^+', function () {

  it("~5^+0", async function () {
    const str = "~5^+0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [5, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^+2", async function () {
    const str = "~5^+2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [5, 0, 2]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^-1", async function () {
    const str = "~5^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [5, 0, -1]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^-2", async function () {
    const str = "~5^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [5, 0, -2]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("~5^-3", async function () {
    const str = "~5^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [5, 0, -3]};
    expectToEqualWithDiff(tst2, result2);
  });
});
/*

describe('relNote: %', function () {

  it("C#4lyd%0", async function () {
    const str = "C#4lyd%0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 6, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%2", async function () {
    const str = "C#4lyd%2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [50, 1, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%-2", async function () {
    const str = "C#4lyd%-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 4, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%lyd", async function () {
    const str = "C#4lyd%lyd";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 6, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%ion", async function () {
    const str = "C#4lyd%ion";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [50, 5, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%phr", async function () {
    const str = "C#4lyd%phr";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [50, 1, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%-lyd", async function () {
    const str = "C#4lyd%-lyd";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 6, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%-ion", async function () {
    const str = "C#4lyd%-ion";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 5, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%-phr", async function () {
    const str = "C#4lyd%-phr";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 1, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4dor%-lyd", async function () {
    const str = "C#4dor%-lyd";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [48, 6, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4dor%-maj", async function () {
    const str = "C#4dor%-maj";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [48, 5, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%min", async function () {
    const str = "C#4lyd%min";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [50, 2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4min%-aeo", async function () {
    const str = "C#4min%-aeo";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "relNote", body: [49, 2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});
*/