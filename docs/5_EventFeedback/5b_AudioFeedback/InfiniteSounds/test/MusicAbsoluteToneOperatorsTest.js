import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('absolute notes */ num', function () {

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

// describe('~~ notes * num', function () {
//
//   it("~~0*2", async function () {
//     const str = "~~0*2";
//     const tst = parse(str);
//     const result = {
//       type: "*",
//       body: [
//         {type: "~~", body: [0]},
//         2
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [12]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("~~1*-2", async function () {
//     const str = "~~1*-2";
//     const tst = parse(str);
//     const result = {
//       type: "*",
//       body: [
//         {type: "~~", body: [1]},
//         -2
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [-11]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("~~17/4", async function () {
//     const str = "~~17/4";
//     const tst = parse(str);
//     const result = {
//       type: "/",
//       body: [
//         {type: "~~", body: [17]},
//         4
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [-7]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("~~-11/-4", async function () {
//     const str = "~~-11/-4";
//     const tst = parse(str);
//     const result = {
//       type: "/",
//       body: [
//         {type: "~~", body: [-11]},
//         -4
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [13]};
//     expectToEqualWithDiff(tst2, result2);
//   });
// });
//
// describe('~~ notes +/- num', function () {
//
//   it("~~0+2", async function () {
//     const str = "~~0+2";
//     const tst = parse(str);
//     const result = {
//       type: "+",
//       body: [
//         {type: "~~", body: [0]},
//         2
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [2]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("~~1-2", async function () {
//     const str = "~~1-2";
//     const tst = parse(str);
//     const result = {
//       type: "-",
//       body: [
//         {type: "~~", body: [1]},
//         2
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [-1]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("~~17+-4", async function () {
//     const str = "~~17+-4";
//     const tst = parse(str);
//     const result = {
//       type: "+",
//       body: [
//         {type: "~~", body: [17]},
//         -4
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [13]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("~~-11/-4", async function () {
//     const str = "~~-11-4";
//     const tst = parse(str);
//     const result = {
//       type: "-",
//       body: [
//         {type: "~~", body: [-11]},
//         4
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "~~", body: [-15]};
//     expectToEqualWithDiff(tst2, result2);
//   });
// });

// describe('absolute notes +- num', function () {
//
//   it("C#4lyd+2", async function () {
//     const str = "C#4lyd+2";
//     const tst = parse(str);
//     const result = {
//       type: "+",
//       body: [
//         {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
//         2
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "absNote", body: [3, 5, "lyd", 0, "C#4lyd"]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd-2", async function () {
//     const str = "C#4lyd-2";
//     const tst = parse(str);
//     const result = {
//       type: "-",
//       body: [
//         {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
//         2
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "absNote", body: [-1, 3, "lyd", 0, "C#4lyd"]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd/4", async function () {
//     const str = "C#4lyd/4";
//     const tst = parse(str);
//     const result = {
//       type: "/",
//       body: [
//         {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
//         4
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "absNote", body: [1, 2, "lyd", 0, "C#4lyd"]};
//     expectToEqualWithDiff(tst2, result2);
//   });
//   it("C#4lyd/-4", async function () {
//     const str = "C#4lyd/-4";
//     const tst = parse(str);
//     const result = {
//       type: "/",
//       body: [
//         {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
//         -4
//       ]
//     };
//     result.body.isDirty = 1;
//     expectToEqualWithDiff(tst, result);
//     const tst2 = await staticInterpret(str);
//     const result2 = {type: "absNote", body: [1, 6, "lyd", 0, "C#4lyd"]};
//     expectToEqualWithDiff(tst2, result2);
//   });
// });