import {parse} from "../Parser2.js";
import {staticInterpret, interpret} from "../Interpreter3.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "c#", body: [], absNote: "C#4", octave: 4, num12: 1};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "a", body: [], absNote: "A5", octave: 5, num12: 9};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "bb", body: [], absNote: "Bb5", octave: 5, num12: 10};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10", function () {
    const tst = parse("D#10");
    const result = {type: "d#", body: [], absNote: "D#10", octave: 10, num12: 3};
    expectToEqualWithDiff(tst, result);
  });
  it("E", function () {
    const tst = parse("E");
    const result = {type: "e", body: [], absNote: "E", octave: 4, num12: 4};
    expectToEqualWithDiff(tst, result);
  });
  it("f#", function () {
    const tst = parse("f#");
    const result = {type: "f#", body: [], absNote: "f#", octave: 4, num12: 6};
    expectToEqualWithDiff(tst, result);
  });
  it("g0", function () {
    const tst = parse("g0");
    const result = {type: "g", body: [], absNote: "g0", octave: 0, num12: 7};
    expectToEqualWithDiff(tst, result);
  });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNote", body: [], tone: "d", /*augment: 1, */octave: -2};
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

// describe('relative alpha notes', function () {
//   it("~C", function () {
//     const tst = parse("~C");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "c", /*augment: 0, */octave: 0});
//   });
//
//   it("~b1", function () {
//     const tst = parse("~b1");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "b", /*augment: 0, */octave: 1});
//   });
//
//   it("~f-1", function () {
//     const tst = parse("~f-1");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "f", /*augment: 0, */octave: -1});
//   });
//
//   it("~Bb-10", function () {
//     const tst = parse("~Bb-10");
//     expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "b", /*augment: -1, */octave: -10});
//   });
//   // it("~Bb#-10", function () {
//   //   expect error
//   // });
// });

describe('relative 7 notes', function () {
  it("~0", function () {
    const tst = parse("~0");
    expectToEqualWithDiff(tst, {type: "~", body: [], num: 0, augment: 0});
  });

  it("~-11", function () {
    const tst = parse("~-11");
    expectToEqualWithDiff(tst, {type: "~", body: [], num: -11, augment: 0});
  });

  it("~+11b", function () {
    const tst = parse("~+11b");
    expectToEqualWithDiff(tst, {type: "~", body: [], num: 11, augment: -1});
  });

  it("~10#", function () {
    const tst = parse("~10#");
    expectToEqualWithDiff(tst, {type: "~", body: [], num: 10, augment: 1});
  });
});

describe('absolute clef, absolute notes', function () {
  it("G4( [C4, Db, Eb3, F, G4, A#, B4])", async function () {
    const str = "G4( [C4, Db, Eb3, F, G4, A#, B4])";
    const tst = parse(str);
    const res = {
      type: "g",
      absNote: "G4",
      num12: 7,
      octave: 4,
      body: [
        [
          {type: "c", absNote: "C4", num12: 0, octave: 4, body: []},
          {type: "db", absNote: "Db", num12: 1, octave: 4, body: []},
          {type: "eb", absNote: "Eb3", num12: 3, octave: 3, body: []},
          {type: "f", absNote: "F", num12: 5, octave: 4, body: []},
          {type: "g", absNote: "G4", num12: 7, octave: 4, body: []},
          {type: "a#", absNote: "A#", num12: 10, octave: 4, body: []},
          {type: "b", absNote: "B4", num12: 11, octave: 4, body: []}
        ]
      ]
    };
    res.body.isDirty = 1;
    res.body[0].isDirty = 1;
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret(str);
    const res2 = {
      type: "g",
      absNote: "G4",
      num12: 7,
      octave: 4,
      body: [
        [
          {type: "~~", body: [-7]},
          {type: "~~", body: [-6]},
          {type: "~~", body: [-4 - 12]},
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