import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('absNoteNum: multiplication *', function () {

  it("C#4lyd*2", async function () {
    const str = "C#4lyd*2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "Note", body: [49, "lyd", 0, 0, 0, 0]},
        2
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 12, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd*-2", async function () {
    const str = "C#4lyd*-2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "Note", body: [49, "lyd", 0, 0, 0, 0]},
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
        {type: "Note", body: [49, "lyd", 0, 0, 0, 0]},
        4
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -24, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd/-4", async function () {
    const str = "C#4lyd/-4";
    const tst = parse(str);
    const result = {
      type: "/",
      body: [
        {type: "Note", body: [49, "lyd", 0, 0, 0, 0]},
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
        {type: "Note", body: [49, "lyd", 0, 0, 0, 0]},
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
        {type: "Note", body: [49, "lyd", 0, 0, 0, 0]},
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
    const result2 = {type: "Note", body: [49, "lyd", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^2", async function () {
    const str = "C#4lyd^^2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", +24, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^-2", async function () {
    const str = "C#4lyd^^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -24, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^-3", async function () {
    const str = "C#4lyd^^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -36, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^^-1", async function () {
    const str = "C#4lyd^^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -12, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('absNoteNum: ^+', function () {

  it("C#4lyd^+0", async function () {
    const str = "C#4lyd^+0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^+2", async function () {
    const str = "C#4lyd^+2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 2, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^-2", async function () {
    const str = "C#4lyd^-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -2, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^-3", async function () {
    const str = "C#4lyd^-3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -3, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd^-1", async function () {
    const str = "C#4lyd^-1";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", -1, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('absNoteNum: %', function () {

  it("C#4lyd%0", async function () {
    const str = "C#4lyd%0";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%2", async function () {
    const str = "C#4lyd%2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 0, 0, 2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%-2", async function () {
    const str = "C#4lyd%-2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 0, 0, -2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%lyd", async function () {
    const str = "C#4lyd%lyd";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "lyd", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%ion", async function () {
    const str = "C#4lyd%ion";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "ion", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%phr", async function () {
    const str = "C#4lyd%phr";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "phr", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%min", async function () {
    const str = "C#4lyd%min";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "min", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

// describe('absNoteNum: %', function () {
// it("C#4lyd%-lyd", async function () {
//   const str = "C#4lyd%-lyd";
//   const tst2 = await staticInterpret(str);
//   const result2 = {type: "Note", body: [49, "lyd", 0, 0, 0, 0]};
//   expectToEqualWithDiff(tst2, result2);
// });
// it("C#4lyd%-ion", async function () {
//   const str = "C#4lyd%-ion";
//   const tst2 = await staticInterpret(str);
//   const result2 = {type: "Note", body: [49, 5, 0, 0, 0, 0]};
//   expectToEqualWithDiff(tst2, result2);
// });
// it("C#4lyd%-phr", async function () {
//   const str = "C#4lyd%-phr";
//   const tst2 = await staticInterpret(str);
//   const result2 = {type: "Note", body: [49, 1, 0, 0, 0, 0]};
//   expectToEqualWithDiff(tst2, result2);
// });
// it("C#4dor%-lyd", async function () {
//   const str = "C#4dor%-lyd";
//   const tst2 = await staticInterpret(str);
//   const result2 = {type: "Note", body: [48, "lyd", 0, 0, 0, 0]};
//   expectToEqualWithDiff(tst2, result2);
// });
// it("C#4dor%-maj", async function () {
//   const str = "C#4dor%-maj";
//   const tst2 = await staticInterpret(str);
//   const result2 = {type: "Note", body: [48, "dor", 0, 0, 0, 0]};
//   expectToEqualWithDiff(tst2, result2);
// });
// it("C#4min%-aeo", async function () {
//   const str = "C#4min%-aeo";
//   const tst2 = await staticInterpret(str);
//   const result2 = {type: "Note", body: [49, "a", 0, 0, 0, 0]};
//   expectToEqualWithDiff(tst2, result2);
// });
// });

// describe('absNoteNum: ! close', function () {
//   it("!E", async function () {
//     const tst = await staticInterpret("!E");
//     const result = {type: "Note", body: [52, 5, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!f#", async function () {
//     const tst = await staticInterpret("!f#");
//     const result = {type: "Note", body: [54, 5, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!g0", async function () {
//     const tst = await staticInterpret("!g0");
//     const result = {type: "Note", body: [7, 5, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!Eion", async function () {
//     const tst = await staticInterpret("!Eion");
//     const result = {type: "Note", body: [52, 5, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!f#phr", async function () {
//     const tst = await staticInterpret("!f#phr");
//     const result = {type: "Note", body: [54, 1, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!g0aeo", async function () {
//     const tst = await staticInterpret("!g0aeo");
//     const result = {type: "Note", body: [7, 2, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!g0maj", async function () {
//     const tst = await staticInterpret("!g0maj");
//     const result = {type: "Note", body: [7, 5, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
//   it("!g0min", async function () {
//     const tst = await staticInterpret("!g0min");
//     const result = {type: "Note", body: [7, 2, 1]};
//     expectToEqualWithDiff(tst, result);
//   });
// });

// describe('absNoteNum: ^/', function () {
//
//   it("C#4lyd^/0", async function () {
//     const str = "C#4lyd^/0";
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "Note", body: [49, "lyd", 0]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd^/2", async function () {
//     const str = "C#4lyd^/2";
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "Note", body: [49 + 7 * 2, "lyd", 0]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd^/-2", async function () {
//     const str = "C#4lyd^/-2";
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "Note", body: [49 - 7 * 2, "lyd", 0]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd^/-3", async function () {
//     const str = "C#4lyd^/-3";
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "Note", body: [49 - 7 * 3, "lyd", 0]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd^/-1", async function () {
//     const str = "C#4lyd^/-1";
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "Note", body: [49 - 7, "lyd", 0]};
//     expectToEqualWithDiff(tst2, result2);
//   });
// });
//
