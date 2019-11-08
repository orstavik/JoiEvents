import {parse} from "../Parser.js";
import {staticInterpret, interpret} from "../Interpreter.js";

describe('absolute clef, absolute notes', function () {

  it("clef up: C4(G4)", async function () {
    const tst = parse("C4(G4)");
    const res = {
      type: "expFun",
      body: [
        {type: "Note", body: [48, undefined]},
        {type: "Note", body: [55, undefined]},
      ]
    };
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret("C4(G4)");
    const res2 = {
      type: "DOCUMENT",
      key: {type: "absNote", body: [48, "maj"]},
      body: [{
        type: "clef",
        key: {type: "relNote", body: [0, 0, 0]},
        body: [{
          type: "relNote",
          body: [0, 0, 4],
        }]
      }]
    };
    expectToEqualWithDiff(tst2, res2);
  });

  it("clef down: G4(C4)", async function () {
    const g4C4 = "G4(C4)";
    const tst = parse(g4C4);
    const res = {
      type: "expFun",
      body: [
        {type: "Note", body: [55, undefined]},
        {type: "Note", body: [48, undefined]},
      ]
    };
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret(g4C4);
    const res2 = {
      type: "DOCUMENT",
      key: {type: "absNote", body: [48, "maj"]},
      body: [{
        type: "clef",
        key: {type: "relNote", body: [0, 0, 4]},
        body: [{
          type: "relNote",
          body: [0, 0, -4],
        }]
      }]
    };
    expectToEqualWithDiff(tst2, res2);
  });

  it("clef with operations: C4(G4^^1)", async function () {
    const str = "C4(G4^^1)";
    const tst = parse(str);
    const res = {
      type: "expFun",
      body: [
        {type: "Note", body: [48, undefined]},
        {
          type: "^^",
          body: [
            {type: "Note", body: [55, undefined]},
            1
          ]
        }
      ]
    };
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret(str);
    const res2 = {
      type: "DOCUMENT",
      key: {type: "absNote", body: [48, "maj"]},
      body: [{
        type: "clef",
        key: {type: "relNote", body: [0, 0, 0]},
        body: [{
          type: "relNote",
          body: [12, 0, 4],
        }]
      }]
    };
    expectToEqualWithDiff(tst2, res2);
  });

  it("Freezing a note: C4(!G4)", async function () {
    const str = "C4(!G4)";
    const tst = parse(str);
    const res = {
      type: "expFun",
      body: [
        {type: "Note", body: [48, undefined]},
        {
          type: "!",
          body: [
            undefined,
            {type: "Note", body: [55, undefined]},
          ]
        }
      ]
    };
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret(str);
    const res2 = {
      type: "DOCUMENT",
      key: {type: "absNote", body: [48, "maj"]},
      body: [{
        type: "clef",
        key: {type: "relNote", body: [0, 0, 0]},
        body: [
          {type: "absNote", body: [55, "maj"]},
        ]
      }]
    };
    expectToEqualWithDiff(tst2, res2);
  });
  it("Clef with relative note: C4(~2(G4))", async function () {
    const str = "C4(~2(G4))";
    const tst = parse(str);
    const res = {
      type: "expFun",
      body: [
        {type: "Note", body: [48, undefined]},
        {
          type: "expFun",
          body: [
            {
              type: "~",
              body: [
                undefined,
                2
              ]
            },
            {type: "Note", body: [55, undefined]},
          ]
        }
      ]
    };
    expectToEqualWithDiff(tst, res);
    const tst2 = await staticInterpret(str);
    const res2 = {
      type: "DOCUMENT",
      key: {type: "absNote", body: [48, "maj"]},
      body: [{
        type: "clef",
        key: {type: "relNote", body: [0, 0, 0]},
        body: [
          {
            type: "clef",
            key: {type: "relNote", body: [0, 0, 2]},
            body: [
              {type: "relNote", body: [0, 0, 2]},
            ]
          }
        ]
      }]
    };
    expectToEqualWithDiff(tst2, res2);
  });
//   it("Overriding the clef from above: D3(G4(C4))", async function () {
//     const tst = parse("D3(G4(C4))");
//     const res = {
//       type: "expFun",
//       body: [
//         {type: "Note", body: [2, 3, 5, 0, "D3"]},
//         {
//           type: "expFun",
//           body: [
//             {type: "Note", body: [7, 4, 5, 0, "G4"]},
//             {type: "Note", body: [0, 4, 5, 0, "C4"]},
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
//             {type: "Note", body: [-7]}
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
//         {type: "Note", body: [2, 3, 5, 0, "D3"]},
//         {
//           type: "expFun",
//           body: [
//             {type: "Note", body: [7, 4, 5, 1, "!G4"]},
//             {type: "Note", body: [0, 4, 5, 0, "C4"]},
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
//             {type: "Note", body: [-7]}
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
//         {type: "Note", body: [7, 4, 5, 0, "G4"]},
//         [
//           {type: "Note", body: [0, 4, 5, 0, "C4"]},
//           {type: "Note", body: [1, 4, 5, 0, "Db"]},
//           {type: "Note", body: [3, 3, 5, 0, "Eb3"]},
//           {type: "Note", body: [5, 4, 5, 0, "F"]},
//           {type: "Note", body: [7, 4, 5, 0, "G4"]},
//           {type: "Note", body: [10, 4, 5, 0, "A#"]},
//           {type: "Note", body: [11, 4, 5, 0, "B4"]}
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
//           {type: "Note", body: [-7]},
//           {type: "Note", body: [-6]},
//           {type: "Note", body: [-16]},
//           {type: "Note", body: [-2]},
//           {type: "Note", body: [0]},
//           {type: "Note", body: [3]},
//           {type: "Note", body: [4]}
//         ]
//       ]
//     };
//     res2.body.isDirty = 1;
//     res2.body[0].isDirty = 1;
//     expectToEqualWithDiff(tst2, res2);
//   });
});

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


// describe('relative 12 notes', function () {
//   it("absNoteNum(0)", function () {
//     const tst = parse("absNoteNum(0)");
//     expectToEqualWithDiff(tst, {type: "Note", body: [0]});
//   });
//
//   it("absNoteNum(-11)", function () {
//     const tst = parse("absNoteNum(-11)");
//     expectToEqualWithDiff(tst, {type: "Note", body: [-11]});
//   });
//
//   it("absNoteNum(+11)", function () {
//     const tst = parse("absNoteNum(+11)");
//     expectToEqualWithDiff(tst, {type: "Note", body: [11]});
//   });
//
//   it("absNoteNum(10)", function () {
//     const tst = parse("absNoteNum(10)");
//     expectToEqualWithDiff(tst, {type: "Note", body: [10]});
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