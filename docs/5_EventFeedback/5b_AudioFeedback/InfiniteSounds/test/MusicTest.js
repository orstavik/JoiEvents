import {parse} from "../Parser2.js";
import {staticInterpret, interpret} from "../Interpreter3.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "absNote", body: [], tone: "c", augment: 1, octave: 4};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "absNote", body: [], tone: "a", augment: 0, octave: 5};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "absNote", body: [], tone: "b", augment: -1, octave: 5};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10", function () {
    const tst = parse("D#10");
    const result = {type: "absNote", body: [], tone: "d", augment: 1, octave: 10};
    expectToEqualWithDiff(tst, result);
  });
  it("E", function () {
    const tst = parse("E");
    const result = {type: "absNote", body: [], tone: "e", augment: 0, octave: 4};
    expectToEqualWithDiff(tst, result);
  });
  it("f#", function () {
    const tst = parse("f#");
    const result = {type: "absNote", body: [], tone: "f", augment: 1, octave: 4};
    expectToEqualWithDiff(tst, result);
  });
  it("g0", function () {
    const tst = parse("g0");
    const result = {type: "absNote", body: [], tone: "g", augment: 0, octave: 0};
    expectToEqualWithDiff(tst, result);
  });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNote", body: [], tone: "d", augment: 1, octave: -2};
  //   expectToEqualWithDiff(tst, result);
  // });
});

describe('relative 12 notes', function () {
  it("~~0", function () {
    const tst = parse("~~0");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: 0, augment: 0});
  });

  it("~~-11", function () {
    const tst = parse("~~-11");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: -11, augment: 0});
  });

  it("~~+11b", function () {
    const tst = parse("~~+11b");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: 11, augment: -1});
  });

  it("~~10#", function () {
    const tst = parse("~~10#");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: 10, augment: 1});
  });
});

describe('relative alpha notes', function () {
  it("~C", function () {
    const tst = parse("~C");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "c", augment: 0, octave: 0});
  });

  it("~b1", function () {
    const tst = parse("~b1");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "b", augment: 0, octave: 1});
  });

  it("~f-1", function () {
    const tst = parse("~f-1");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "f", augment: 0, octave: -1});
  });

  it("~Bb-10", function () {
    const tst = parse("~Bb-10");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "b", augment: -1, octave: -10});
  });
  // it("~Bb#-10", function () {
  //   expect error
  // });
});

describe('static interpretation of clef', function () {
  it("~(G4, sine(~2))", async function () {
    const tst = await staticInterpret("~(G4, sine(~2))");
    const res = {
      type: "~",
      body: [
        {
          type: "note",
          absTone: "g",
          absToneSeven: 4,
          augment: 0,
          absOctave: 4,
          relToneTwelve: "wtf",
          body: [],
        },
        {
          type: "sine",
          body: [
            {
              type: "note",
              relTone: 2,
              relAugmented: 0,
              relToneTwelve: "wtf",
              body: [],
            }
          ]
        }
      ],
    };
    res.body[1].body["isDirty"] = 1;
    res.body["isDirty"] = 1;
    expectToEqualWithDiff(tst, res);
  });
});

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