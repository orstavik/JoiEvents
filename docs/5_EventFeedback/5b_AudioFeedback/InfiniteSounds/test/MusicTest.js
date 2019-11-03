import {parse} from "../Parser.js";
import {staticInterpret, interpret} from "../Interpreter.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "absNoteNum", body: [49, 5, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "absNoteNum", body: [69, 5, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "absNoteNum", body: [70, 5, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10", function () {
    const tst = parse("D#10");
    const result = {type: "absNoteNum", body: [123, 5, 0]};
    expectToEqualWithDiff(tst, result);
  });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNoteNum", mode: 5, tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

describe('absolute notes with modes', function () {
  it("C#4lyd", function () {
    const tst = parse("C#4lyd");
    const result = {type: "absNoteNum", body: [49, 6, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("A5loc", function () {
    const tst = parse("A5loc");
    const result = {type: "absNoteNum", body: [69, 0, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5dor", function () {
    const tst = parse("Bb5dor");
    const result = {type: "absNoteNum", body: [70, 3, 0]};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10mix", function () {
    const tst = parse("D#10mix");
    const result = {type: "absNoteNum", body: [123, 4, 0]};
    expectToEqualWithDiff(tst, result);
  });
  // it("!g0major", function () {
  //   const tst = parse("!g0maj");
  //   const result = {type: "absNoteNum", body: [7, 0, 5, 1, "!g0"]};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0min", function () {
  //   const tst = parse("!g0min");
  //   const result = {type: "absNoteNum", body: [7, 0, "aeo", 1, "!g0"]};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%2", function () {
  //   const tst = parse("!g0%2");
  //   const result = {type: "absNoteNum", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: 2};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%-1", function () {
  //   const tst = parse("!g0%-1");
  //   const result = {type: "absNoteNum", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: -1};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%0", function () {
  //   const tst = parse("!g0%0");
  //   const result = {type: "absNoteNum", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNoteNum", tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

// describe('relative 12 notes', function () {
//   it("absNoteNum(0)", function () {
//     const tst = parse("absNoteNum(0)");
//     expectToEqualWithDiff(tst, {type: "absNoteNum", body: [0]});
//   });
//
//   it("absNoteNum(-11)", function () {
//     const tst = parse("absNoteNum(-11)");
//     expectToEqualWithDiff(tst, {type: "absNoteNum", body: [-11]});
//   });
//
//   it("absNoteNum(+11)", function () {
//     const tst = parse("absNoteNum(+11)");
//     expectToEqualWithDiff(tst, {type: "absNoteNum", body: [11]});
//   });
//
//   it("absNoteNum(10)", function () {
//     const tst = parse("absNoteNum(10)");
//     expectToEqualWithDiff(tst, {type: "absNoteNum", body: [10]});
//   });
// });

// describe('relative alpha notes', function () {
//   it("~C", function () {
//     const tst = parse("~C");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [0, "c"]});
//   });
//
//   it("~b", function () {
//     const tst = parse("~b");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [11, "b"]});
//   });
//
//   it("~f#", function () {
//     const tst = parse("~f#");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [6, "f#"]});
//   });
//
//   it("~Bb", function () {
//     const tst = parse("~Bb");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [10, "bb"]});
//   });
//   // it("~Bb#-10", function () {
//   //   expect error
//   // });
// });
//
describe('7scale prefix operator: relative 7 notes', function () {
  it("~0", async function () {
    const tst = parse("~0");
    expectToEqualWithDiff(tst, {type: "~", body: [undefined, 0]});
    const tst2 = await staticInterpret("~0");
    expectToEqualWithDiff(tst2, {type: "relNote", body: [0, 0, 0]});
  });

  it("~-11", async function () {
    const tst = parse("~-11");
    expectToEqualWithDiff(tst, {type: "~", body: [undefined, -11]});
    const tst2 = await staticInterpret("~-11");
    expectToEqualWithDiff(tst2, {type: "relNote", body: [-11, 0, 0]});
  });

  it("~11", async function () {
    const tst = parse("~11");
    expectToEqualWithDiff(tst, {type: "~", body: [undefined, 11]});
    const tst2 = await staticInterpret("~11");
    expectToEqualWithDiff(tst2, {type: "relNote", body: [11, 0, 0]});
  });

  // it("~+11b", function () {
  //   const tst = parse("~+11b");
  //   expectToEqualWithDiff(tst, {type: "~", body: [11, -1]});
  // });
  //
  // it("~10#", function () {
  //   const tst = parse("~10#");
  //   expectToEqualWithDiff(tst, {type: "~", body: [10, 1]});
  // });
});

// describe('absolute clef, absolute notes', function () {
//   it("Setting the clef, nice an simple: G4(C4)", async function () {
//     const tst = parse("G4(C4)");
//     const res = {
//       type: "expFun",
//       body: [
//         {type: "absNoteNum", body: [7, 4, 5, 0, "G4"]},
//         {type: "absNoteNum", body: [0, 4, 5, 0, "C4"]},
//       ]
//     };
//     res.body.isDirty = 1;
//     expectToEqualWithDiff(tst, res);
//     const tst2 = await staticInterpret("G4(C4)");
//     const res2 = {
//       type: "absClef", num: 7, octave: 4, mode: 5, frozen: 0, text: "G4",
//       body: [
//         {type: "absNoteNum", body: [-7]}
//       ]
//     };
//     res2.body.isDirty = 1;
//     expectToEqualWithDiff(tst2, res2);
//   });
//   it("Freezing a note: G4(!C4)", async function () {
//     const tst = parse("G4(!C4)");
//     const res = {
//       type: "expFun",
//       body: [
//         {type: "absNoteNum", body: [7, 4, 5, 0, "G4"]},
//         {type: "absNoteNum", body: [0, 4, 5, 1, "!C4"]},
//       ]
//     };
//     res.body.isDirty = 1;
//     expectToEqualWithDiff(tst, res);
//     const tst2 = await staticInterpret("G4(!C4)");
//     const res2 = {
//       type: "absClef", num: 7, octave: 4, mode: 5, frozen: 0, text: "G4",
//       body: [
//         {type: "absNoteNum", body: [0, 4, 5, 1, "!C4"]}
//       ]
//     };
//     res2.body.isDirty = 1;
//     expectToEqualWithDiff(tst2, res2);
//   });
//   it("Overriding the clef from above: D3(G4(C4))", async function () {
//     const tst = parse("D3(G4(C4))");
//     const res = {
//       type: "expFun",
//       body: [
//         {type: "absNoteNum", body: [2, 3, 5, 0, "D3"]},
//         {
//           type: "expFun",
//           body: [
//             {type: "absNoteNum", body: [7, 4, 5, 0, "G4"]},
//             {type: "absNoteNum", body: [0, 4, 5, 0, "C4"]},
//           ]
//         }
//       ]
//     };
//     res.body.isDirty = 1;
//     res.body[1].body.isDirty = 1;
//     expectToEqualWithDiff(tst, res);
//     //the clef G4 is essentially nulled out, after the relative value of C4 is interpreted within the G4 scale.
//     const tst2 = await staticInterpret("D3(G4(C4))");
//     const res2 = {
//       type: "absClef", num: 2, octave: 3, mode: 5, frozen: 0, text: "D3",
//       body: [
//         {
//           type: "relClef12",
//           num: 0,
//           body: [
//             {type: "absNoteNum", body: [-7]}
//           ]
//         }
//       ]
//     };
//     res2.body.isDirty = 1;
//     res2.body[0].body.isDirty = 1;
//     expectToEqualWithDiff(tst2, res2);
//   });
//   it("Freezing the clef, overriding the clef from below: D3(!G4(C4))", async function () {
//     const tst = parse("D3(!G4(C4))");
//     const res = {
//       type: "expFun",
//       body: [
//         {type: "absNoteNum", body: [2, 3, 5, 0, "D3"]},
//         {
//           type: "expFun",
//           body: [
//             {type: "absNoteNum", body: [7, 4, 5, 1, "!G4"]},
//             {type: "absNoteNum", body: [0, 4, 5, 0, "C4"]},
//           ]
//         }
//       ]
//     };
//     res.body.isDirty = 1;
//     res.body[1].body.isDirty = 1;
//     expectToEqualWithDiff(tst, res);
//     //the clef G4 is frozen, it is not converted into a relative clef.
//     const tst2 = await staticInterpret("D3(!G4(C4))");
//     const res2 = {
//       type: "absClef", num: 2, octave: 3, mode: 5, frozen: 0, text: "D3",
//       body: [
//         {
//           type: "absClef", num: 7, octave: 4, mode: 5, frozen: 1, text: "!G4",
//           body: [
//             {type: "absNoteNum", body: [-7]}
//           ]
//         }
//       ]
//     };
//     res2.body.isDirty = 1;
//     res2.body[0].body.isDirty = 1;
//     expectToEqualWithDiff(tst2, res2);
//   });
//   it("parse: G4( [C4, Db, Eb3, F, G4, A#, B4])", async function () {
//     const str = "G4( [C4, Db, Eb3, F, G4, A#, B4])";
//     const tst = parse(str);
//     const res = {
//       type: "expFun",
//       body: [
//         {type: "absNoteNum", body: [7, 4, 5, 0, "G4"]},
//         [
//           {type: "absNoteNum", body: [0, 4, 5, 0, "C4"]},
//           {type: "absNoteNum", body: [1, 4, 5, 0, "Db"]},
//           {type: "absNoteNum", body: [3, 3, 5, 0, "Eb3"]},
//           {type: "absNoteNum", body: [5, 4, 5, 0, "F"]},
//           {type: "absNoteNum", body: [7, 4, 5, 0, "G4"]},
//           {type: "absNoteNum", body: [10, 4, 5, 0, "A#"]},
//           {type: "absNoteNum", body: [11, 4, 5, 0, "B4"]}
//         ]
//       ]
//     };
//     res.body.isDirty = 1;
//     res.body[1].isDirty = 1;
//     expectToEqualWithDiff(tst, res);
//   });
//   it("interpret: G4( [C4, Db, Eb3, F, G4, A#, B4])", async function () {
//     const str = "G4( [C4, Db, Eb3, F, G4, A#, B4])";
//     const tst2 = await staticInterpret(str);
//     const res2 = {
//       type: "absClef", num: 7,octave:  4, mode: 5, frozen: 0, text: "G4",
//       body: [
//         [
//           {type: "absNoteNum", body: [-7]},
//           {type: "absNoteNum", body: [-6]},
//           {type: "absNoteNum", body: [-16]},
//           {type: "absNoteNum", body: [-2]},
//           {type: "absNoteNum", body: [0]},
//           {type: "absNoteNum", body: [3]},
//           {type: "absNoteNum", body: [4]}
//         ]
//       ]
//     };
//     res2.body.isDirty = 1;
//     res2.body[0].isDirty = 1;
//     expectToEqualWithDiff(tst2, res2);
//   });
// })
//;

//todo older below

// describe('static interpretation of clef', function () {
//   it("~(G4, sine(~2))", async function () {
//     const tst = await staticInterpret("~(G4, sine(~2))");
//     const res = {
//       type: "~",
//       body: [
//         {
//           type: "note",
//           tone: "g",
//           num7: 4,
//           augment: 0,
//           octave: 4,
//           relToneTwelve: "wtf",
//           body: [],
//         },
//         {
//           type: "sine",
//           body: [
//             {
//               type: "note",
//               relTone: 2,
//               relAugmented: 0,
//               relToneTwelve: "wtf",
//               body: [],
//             }
//           ]
//         }
//       ],
//     };
//     res.body[1].body["isDirty"] = 1;
//     res.body["isDirty"] = 1;
//     expectToEqualWithDiff(tst, res);
//   });
// });
//
// describe('dynamic interpretation of clef', function () {
//   it("~(G4, sine(A4))", async function () {
//     const tst = await interpret("~(G4, sine(A4))", new AudioContext());
//     const res = {
//       type: "~",
//       body: [
//         {
//           type: "note",
//           body: [
//             "g",
//             4
//           ]
//         },
//         {
//           type: "sine",
//           body: [
//             {
//               type: "note",
//               body: [
//                 "a",
//                 4
//               ]
//             }
//           ]
//         }
//       ],
//       clefKey: {
//         type: "note",
//         body: [
//           "g",
//           4
//         ]
//       },
//       clef: {
//         0: [],
//         1: [],
//         2: [],
//         3: [],
//         4: [],
//         5: [],
//         6: [],
//         7: [],
//         8: [],
//         9: [],
//         10: [],
//         11: []
//       }
//     };
//     expectToEqualWithDiff(tst, res);
//   });
// });

// describe('keys', function () {
//   it("G~C#4", function () {
//     const tst = parse("G~C#4");
//     const result = {type: "note", body: ["C#", 4]};
//     expectToEqualWithDiff(tst, result);
//   });
// });