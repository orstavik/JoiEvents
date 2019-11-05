import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "Note", body: [49, undefined, 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "Note", body: [69, undefined, 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "Note", body: [70, undefined, 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10", function () {
    const tst = parse("D#10");
    const result = {type: "Note", body: [123, undefined, 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "Note", mode: 5, tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

describe('absolute notes with modes', function () {
  it("C#4lyd", function () {
    const tst = parse("C#4lyd");
    const result = {type: "Note", body: [49, "lyd", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("A5loc", function () {
    const tst = parse("A5loc");
    const result = {type: "Note", body: [69, "loc", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5dor", function () {
    const tst = parse("Bb5dor");
    const result = {type: "Note", body: [70, "dor", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10mix", function () {
    const tst = parse("D#10mix");
    const result = {type: "Note", body: [123, "mix", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  // it("!g0major", function () {
  //   const tst = parse("!g0maj");
  //   const result = {type: "Note", body: [7, 0, 5, 1, "!g0"]};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0min", function () {
  //   const tst = parse("!g0min");
  //   const result = {type: "Note", body: [7, 0, "aeo", 1, "!g0"]};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%2", function () {
  //   const tst = parse("!g0%2");
  //   const result = {type: "Note", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: 2};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%-1", function () {
  //   const tst = parse("!g0%-1");
  //   const result = {type: "Note", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: -1};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%0", function () {
  //   const tst = parse("!g0%0");
  //   const result = {type: "Note", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "Note", tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

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
  it("C#4lyd%3%phr", async function () {
    const str = "C#4lyd%3%phr";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "phr", 0, 0, 0, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("C#4lyd%min%3", async function () {
    const str = "C#4lyd%min%3";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [49, "min", 0, 0, 3, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});

describe('absNoteNum: ! close', function () {
  it("!E", async function () {
    const tst = await staticInterpret("!E");
    const result = {type: "Note", body: [52, undefined, 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!f#", async function () {
    const tst = await staticInterpret("!f#");
    const result = {type: "Note", body: [54, undefined, 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0", async function () {
    const tst = await staticInterpret("!g0");
    const result = {type: "Note", body: [7, undefined, 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!Eion", async function () {
    const tst = await staticInterpret("!Eion");
    const result = {type: "Note", body: [52, "ion", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!f#phr", async function () {
    const tst = await staticInterpret("!f#phr");
    const result = {type: "Note", body: [54, "phr", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0aeo", async function () {
    const tst = await staticInterpret("!g0aeo");
    const result = {type: "Note", body: [7, "aeo", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0maj", async function () {
    const tst = await staticInterpret("!g0maj");
    const result = {type: "Note", body: [7, "maj", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0min", async function () {
    const tst = await staticInterpret("!g0min");
    const result = {type: "Note", body: [7, "min", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst, result);
  });
});

describe('normalizeToAbsolute multiple operations', function () {
  it("C#4lyd~1^+2^^3", async function () {
    const str = "C4lyd~1^+2^^3%2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [48, "lyd", 38, 1, 2, 0]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("!(C#4lyd~1^+2^^3)", async function () {
    const str = "!(C4lyd~1^+2^^3%2)";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [88, "phr", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst2, result2);
  });
  it("!C#4lyd~1^+2^^3", async function () {
    const str = "!C4lyd~1^+2^^3%2";
    const tst2 = await staticInterpret(str);
    const result2 = {type: "Note", body: [88, "phr", 0, 0, 0, 1]};
    expectToEqualWithDiff(tst2, result2);
  });
});

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
