import {parse} from "../Parser.js";
import {staticInterpret, interpret} from "../Interpreter.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "absNote", mode: "ion", tone: "C#4", octave: 4, num: 1, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "absNote", mode: "ion", tone: "A5", octave: 5, num: 9, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "absNote", mode: "ion", tone: "Bb5", octave: 5, num: 10, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10", function () {
    const tst = parse("D#10");
    const result = {type: "absNote", mode: "ion", tone: "D#10", octave: 10, num: 3, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("!E", function () {
    const tst = parse("!E");
    const result = {type: "absNote", mode: "ion", tone: "!E", octave: 4, num: 4, frozen: 1};
    expectToEqualWithDiff(tst, result);
  });
  it("!f#", function () {
    const tst = parse("!f#");
    const result = {type: "absNote", mode: "ion", tone: "!f#", octave: 4, num: 6, frozen: 1};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0", function () {
    const tst = parse("!g0");
    const result = {type: "absNote", mode: "ion", tone: "!g0", octave: 0, num: 7, frozen: 1};
    expectToEqualWithDiff(tst, result);
  });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNote", mode: "ion", tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

describe('absolute notes with modes', function () {
  it("C#4lyd", function () {
    const tst = parse("C#4lyd");
    const result = {type: "absNote", mode: "ion", tone: "C#4lyd", octave: 4, num: 1, frozen: 0, mode: "lyd"};
    expectToEqualWithDiff(tst, result);
  });
  it("A5locrian", function () {
    const tst = parse("A5locrian");
    const result = {type: "absNote", tone: "A5locrian", octave: 5, num: 9, frozen: 0, mode: "locr"};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5dorian", function () {
    const tst = parse("Bb5dorian");
    const result = {type: "absNote", tone: "Bb5dorian", octave: 5, num: 10, frozen: 0, mode: "dor"};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10mixolyd", function () {
    const tst = parse("D#10mixolyd");
    const result = {type: "absNote", tone: "D#10mixolyd", octave: 10, num: 3, frozen: 0, mode: "mixolyd"};
    expectToEqualWithDiff(tst, result);
  });
  it("!Eion", function () {
    const tst = parse("!Eion");
    const result = {type: "absNote", tone: "!Eion", octave: 4, num: 4, frozen: 1, mode: "ion"};
    expectToEqualWithDiff(tst, result);
  });
  it("!f#phryg", function () {
    const tst = parse("!f#phryg");
    const result = {type: "absNote", tone: "!f#phryg", octave: 4, num: 6, frozen: 1, mode: "phryg"};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0aeol", function () {
    const tst = parse("!g0aeol");
    const result = {type: "absNote", tone: "!g0aeol", octave: 0, num: 7, frozen: 1, mode: "aeol"};
    expectToEqualWithDiff(tst, result);
  });
  // it("!g0major", function () {
  //   const tst = parse("!g0maj");
  //   const result = {type: "absNote", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: "ion"};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0min", function () {
  //   const tst = parse("!g0min");
  //   const result = {type: "absNote", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: "aeol"};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%2", function () {
  //   const tst = parse("!g0%2");
  //   const result = {type: "absNote", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: 2};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%-1", function () {
  //   const tst = parse("!g0%-1");
  //   const result = {type: "absNote", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: -1};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("!g0%0", function () {
  //   const tst = parse("!g0%0");
  //   const result = {type: "absNote", tone: "!g0", octave: 0, num: 7, frozen: 1, mode: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNote", tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

describe('relative 12 notes', function () {
  it("~~0", function () {
    const tst = parse("~~0");
    expectToEqualWithDiff(tst, {type: "~~", body: [0]});
  });

  it("~~-11", function () {
    const tst = parse("~~-11");
    expectToEqualWithDiff(tst, {type: "~~", body: [-11]});
  });

  it("~~+11", function () {
    const tst = parse("~~+11");
    expectToEqualWithDiff(tst, {type: "~~", body: [11]});
  });

  it("~~10", function () {
    const tst = parse("~~10");
    expectToEqualWithDiff(tst, {type: "~~", body: [10]});
  });
});

describe('relative alpha notes', function () {
  it("~C", function () {
    const tst = parse("~C");
    expectToEqualWithDiff(tst, {type: "relNote", body: [0, "c"]});
  });

  it("~b", function () {
    const tst = parse("~b");
    expectToEqualWithDiff(tst, {type: "relNote", body: [11, "b"]});
  });

  it("~f#", function () {
    const tst = parse("~f#");
    expectToEqualWithDiff(tst, {type: "relNote", body: [6, "f#"]});
  });

  it("~Bb", function () {
    const tst = parse("~Bb");
    expectToEqualWithDiff(tst, {type: "relNote", body: [10, "bb"]});
  });
  // it("~Bb#-10", function () {
  //   expect error
  // });
});

describe('relative 7 notes', function () {
  it("~0", function () {
    const tst = parse("~0");
    expectToEqualWithDiff(tst, {type: "~", body: [0, 0]});
  });

  it("~-11", function () {
    const tst = parse("~-11");
    expectToEqualWithDiff(tst, {type: "~", body: [-11, 0]});
  });

  it("~+11b", function () {
    const tst = parse("~+11b");
    expectToEqualWithDiff(tst, {type: "~", body: [11, -1]});
  });

  it("~10#", function () {
    const tst = parse("~10#");
    expectToEqualWithDiff(tst, {type: "~", body: [10, 1]});
  });
});

describe('absolute clef, absolute notes', function () {
  it("Setting the clef, nice an simple: G4(C4)", async function () {
    const tst = parse("G4(C4)");
    const res = {
      type: "expFun",
      body: [
        {type: "absNote", tone: "G4", mode: "ion", num: 7, frozen: 0, octave: 4},
        {type: "absNote", tone: "C4", mode: "ion", num: 0, frozen: 0, octave: 4},
      ]
    };
    res.body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret("G4(C4)");
    const res2 = {
      type: "absNote", tone: "G4", mode: "ion", num: 7, frozen: 0, octave: 4,
      body: [
        {type: "~~", body: [-7]}
      ]
    };
    res2.body.isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
  it("Freezing a note: G4(!C4)", async function () {
    const tst = parse("G4(!C4)");
    const res = {
      type: "expFun",
      body: [
        {type: "absNote", tone: "G4", mode: "ion", num: 7, frozen: 0, octave: 4},
        {type: "absNote", tone: "!C4", mode: "ion", num: 0, frozen: 1, octave: 4},
      ]
    };
    res.body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret("G4(!C4)");
    const res2 = {
      type: "absNote", tone: "G4", mode: "ion", num: 7, frozen: 0, octave: 4,
      body: [
        {type: "absNote", tone: "!C4", mode: "ion", num: 0, frozen: 1, octave: 4}
      ]
    };
    res2.body.isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
  it("Overriding the clef from above: D3(G4(C4))", async function () {
    const tst = parse("D3(G4(C4))");
    const res = {
      type: "expFun",
      body: [
        {type: "absNote", tone: "D3", mode: "ion", num: 2, frozen: 0, octave: 3},
        {
          type: "expFun",
          body: [
            {type: "absNote", tone: "G4", mode: "ion", num: 7, frozen: 0, octave: 4},
            {type: "absNote", tone: "C4", mode: "ion", num: 0, frozen: 0, octave: 4},
          ]
        }
      ]
    };
    res.body.isDirty = 1;
    res.body[1].body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    //the clef G4 is essentially nulled out, after the relative value of C4 is interpreted within the G4 scale.
    const tst2 = await staticInterpret("D3(G4(C4))");
    const res2 = {
      type: "absNote", tone: "D3", mode: "ion", num: 2, frozen: 0, octave: 3,
      body: [
        {
          type: "~~",
          num: 0,
          body: [
            {type: "~~", body: [-7]}
          ]
        }
      ]
    };
    res2.body.isDirty = 1;
    res2.body[0].body.isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
  it("Freezing the clef, overriding the clef from below: D3(!G4(C4))", async function () {
    const tst = parse("D3(!G4(C4))");
    const res = {
      type: "expFun",
      body: [
        {type: "absNote", tone: "D3", mode: "ion", num: 2, frozen: 0, octave: 3},
        {
          type: "expFun",
          body: [
            {type: "absNote", tone: "!G4", mode: "ion", num: 7, frozen: 1, octave: 4},
            {type: "absNote", tone: "C4", mode: "ion", num: 0, frozen: 0, octave: 4},
          ]
        }
      ]
    };
    res.body.isDirty = 1;
    res.body[1].body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    //the clef G4 is frozen, it is not converted into a relative clef.
    const tst2 = await staticInterpret("D3(!G4(C4))");
    const res2 = {
      type: "absNote", tone: "D3", mode: "ion", num: 2, frozen: 0, octave: 3,
      body: [
        {
          type: "absNote", tone: "!G4", mode: "ion", num: 7, frozen: 1, octave: 4,
          body: [
            {type: "~~", body: [-7]}
          ]
        }
      ]
    };
    res2.body.isDirty = 1;
    res2.body[0].body.isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
  it("parse: G4( [C4, Db, Eb3, F, G4, A#, B4])", async function () {
    const str = "G4( [C4, Db, Eb3, F, G4, A#, B4])";
    const tst = parse(str);
    const res = {
      type: "expFun",
      body: [
        {type: "absNote", tone: "G4", num: 7, octave: 4, mode: "ion", frozen: 0},
        [
          {type: "absNote", tone: "C4", num: 0, octave: 4, mode: "ion", frozen: 0},
          {type: "absNote", tone: "Db", num: 1, octave: 4, mode: "ion", frozen: 0},
          {type: "absNote", tone: "Eb3", num: 3, octave: 3, mode: "ion", frozen: 0},
          {type: "absNote", tone: "F", num: 5, octave: 4, mode: "ion", frozen: 0},
          {type: "absNote", tone: "G4", num: 7, octave: 4, mode: "ion", frozen: 0},
          {type: "absNote", tone: "A#", num: 10, octave: 4, mode: "ion", frozen: 0},
          {type: "absNote", tone: "B4", num: 11, octave: 4, mode: "ion", frozen: 0}
        ]
      ]
    };
    res.body.isDirty = 1;
    res.body[1].isDirty = 1;
    expectToEqualWithDiff(tst, res);
  });
  it("interpret: G4( [C4, Db, Eb3, F, G4, A#, B4])", async function () {
    const str = "G4( [C4, Db, Eb3, F, G4, A#, B4])";
    const tst2 = await staticInterpret(str);
    const res2 = {
      type: "absNote", tone: "G4", num: 7, octave: 4, mode: "ion", frozen: 0,
      body: [
        [
          {type: "~~", body: [-7]},
          {type: "~~", body: [-6]},
          {type: "~~", body: [-16]},
          {type: "~~", body: [-2]},
          {type: "~~", body: [0]},
          {type: "~~", body: [3]},
          {type: "~~", body: [4]}
        ]
      ]
    };
    res2.body.isDirty = 1;
    res2.body[0].isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
})
;

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