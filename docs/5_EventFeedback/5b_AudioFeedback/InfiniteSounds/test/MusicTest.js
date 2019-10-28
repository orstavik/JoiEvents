import {parse} from "../Parser2.js";
import {staticInterpret, interpret} from "../Interpreter3.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "absNote", body: [], tone: "c#4", octave: 4, num: 1, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "absNote", body: [], tone: "a5", octave: 5, num: 9, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "absNote", body: [], tone: "bb5", octave: 5, num: 10, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("D#10", function () {
    const tst = parse("D#10");
    const result = {type: "absNote", body: [], tone: "d#10", octave: 10, num: 3, frozen: 0};
    expectToEqualWithDiff(tst, result);
  });
  it("!E", function () {
    const tst = parse("!E");
    const result = {type: "absNote", body: [], tone: "!e", octave: 4, num: 4, frozen: 1};
    expectToEqualWithDiff(tst, result);
  });
  it("!f#", function () {
    const tst = parse("!f#");
    const result = {type: "absNote", body: [], tone: "!f#", octave: 4, num: 6, frozen: 1};
    expectToEqualWithDiff(tst, result);
  });
  it("!g0", function () {
    const tst = parse("!g0");
    const result = {type: "absNote", body: [], tone: "!g0", octave: 0, num: 7, frozen: 1};
    expectToEqualWithDiff(tst, result);
  });
  // it("D#-2", function () {//todo this should throw an error. Absolute tones cannot have negative octave
  //   const tst = parse("D#-2");
  //   const result = {type: "absNote", body: [], tone: "d", /*augment: 1, */octave: -2, frozen: 0};
  //   expectToEqualWithDiff(tst, result);
  // });
});

describe('relative 12 notes', function () {
  it("~~0", function () {
    const tst = parse("~~0");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: 0});
  });

  it("~~-11", function () {
    const tst = parse("~~-11");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: -11});
  });

  it("~~+11", function () {
    const tst = parse("~~+11");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: 11});
  });

  it("~~10", function () {
    const tst = parse("~~10");
    expectToEqualWithDiff(tst, {type: "~~", body: [], num: 10});
  });
});

describe('relative alpha notes', function () {
  it("~C", function () {
    const tst = parse("~C");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "c", num: 0, octave: 0});
  });

  it("~b1", function () {
    const tst = parse("~b1");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "b", num: 11, octave: 1});
  });

  it("~f#-1", function () {
    const tst = parse("~f#-1");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "f#", num: 6, octave: -1});
  });

  it("~Bb-10", function () {
    const tst = parse("~Bb-10");
    expectToEqualWithDiff(tst, {type: "relNote", body: [], tone: "bb", num: 10, octave: -10});
  });
  // it("~Bb#-10", function () {
  //   expect error
  // });
});

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
  it("Setting the clef, nice an simple: G4(C4)", async function () {
    const tst = parse("G4(C4)");
    const res = {
      type: "absNote", tone: "g4", num: 7, frozen: 0, octave: 4,
      body: [
        {type: "absNote", tone: "c4", num: 0, frozen: 0, octave: 4, body: []},
      ]
    };
    res.body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret("G4(C4)");
    const res2 = {
      type: "absNote", tone: "g4", num: 7, frozen: 0, octave: 4,
      body: [
        {type: "~~", num: -7, body: []},
      ]
    };
    res2.body.isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
  it("Freezing a note: G4(!C4)", async function () {
    const tst = parse("G4(!C4)");
    const res = {
      type: "absNote", tone: "g4", num: 7, frozen: 0, octave: 4,
      body: [
        {type: "absNote", tone: "!c4", num: 0, frozen: 1, octave: 4, body: []},
      ]
    };
    res.body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret("G4(!C4)");
    const res2 = {
      type: "absNote", tone: "g4", num: 7, frozen: 0, octave: 4,
      body: [
        {type: "absNote", tone: "!c4", num: 0, frozen: 1, octave: 4, body: []},
      ]
    };
    res2.body.isDirty = 1;
    expectToEqualWithDiff(tst2, res2);
  });
  it("Overriding the clef from above: D3(G4(C4))", async function () {
    const tst = parse("D3(G4(C4))");
    const res = {
      type: "absNote", tone: "d3", num: 2, frozen: 0, octave: 3,
      body: [
        {
          type: "absNote", tone: "g4", num: 7, frozen: 0, octave: 4,
          body: [
            {type: "absNote", tone: "c4", num: 0, frozen: 0, octave: 4, body: []},
          ]
        }
      ]
    };
    res.body.isDirty = 1;
    res.body[0].body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    //the clef G4 is essentially nulled out, after the relative value of C4 is interpreted within the G4 scale.
    const tst2 = await staticInterpret("D3(G4(C4))");
    const res2 = {
      type: "absNote", tone: "d3", num: 2, frozen: 0, octave: 3,
      body: [
        {
          type: "~~", num: 0,
          body: [
            {type: "~~", num: -7, body: []},
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
      type: "absNote", tone: "d3", num: 2, frozen: 0, octave: 3,
      body: [
        {
          type: "absNote", tone: "!g4", num: 7, frozen: 1, octave: 4,
          body: [
            {type: "absNote", tone: "c4", num: 0, frozen: 0, octave: 4, body: []},
          ]
        }
      ]
    };
    res.body.isDirty = 1;
    res.body[0].body.isDirty = 1;
    expectToEqualWithDiff(tst, res);
    //the clef G4 is frozen, it is not converted into a relative clef.
    const tst2 = await staticInterpret("D3(!G4(C4))");
    const res2 = {
      type: "absNote", tone: "d3", num: 2, frozen: 0, octave: 3,
      body: [
        {
          type: "absNote", tone: "!g4", num: 7, frozen: 1, octave: 4,
          body: [
            {type: "~~", num: -7, body: []},
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
      type: "absNote",
      tone: "g4",
      num: 7,
      octave: 4,
      frozen: 0,
      body: [
        [
          {type: "absNote", tone: "c4", num: 0, frozen: 0, octave: 4, body: []},
          {type: "absNote", tone: "db", num: 1, frozen: 0, octave: 4, body: []},
          {type: "absNote", tone: "eb3", num: 3, frozen: 0, octave: 3, body: []},
          {type: "absNote", tone: "f", num: 5, frozen: 0, octave: 4, body: []},
          {type: "absNote", tone: "g4", num: 7, frozen: 0, octave: 4, body: []},
          {type: "absNote", tone: "a#", num: 10, frozen: 0, octave: 4, body: []},
          {type: "absNote", tone: "b4", num: 11, frozen: 0, octave: 4, body: []}
        ]
      ]
    };
    res.body.isDirty = 1;
    res.body[0].isDirty = 1;
    expectToEqualWithDiff(tst, res);
  });
  it("interpret: G4( [C4, Db, Eb3, F, G4, A#, B4])", async function () {
    const str = "G4( [C4, Db, Eb3, F, G4, A#, B4])";
    const tst2 = await staticInterpret(str);
    const res2 = {
      type: "absNote",
      tone: "g4",
      num: 7,
      octave: 4,
      frozen: 0,
      body: [
        [
          {type: "~~", num: -7, body: []},
          {type: "~~", num: -6, body: []},
          {type: "~~", num: -4 - 12, body: []},
          {type: "~~", num: -2, body: []},
          {type: "~~", num: 0, body: []},
          {type: "~~", num: 3, body: []},
          {type: "~~", num: 4, body: []},
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