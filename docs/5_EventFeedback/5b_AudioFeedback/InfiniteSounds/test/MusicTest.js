import {parse} from "../Parser2.js";
import {staticInterpret, interpret} from "../Interpreter3.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "note", body: ["c#", 4, undefined]};
    expectToEqualWithDiff(tst, result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "note", body: ["a", 5, undefined]};
    expectToEqualWithDiff(tst, result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "note", body: ["bb", 5, undefined]};
    expectToEqualWithDiff(tst, result);
  });
  it("D#-2", function () {
    const tst = parse("D#-2");
    const result = {type: "note", body: ["d#", -2, undefined]};
    expectToEqualWithDiff(tst, result);
  });
  it("E", function () {
    const tst = parse("E");
    const result = {type: "note", body: ["e", undefined, undefined]};
    expectToEqualWithDiff(tst, result);
  });
  it("f#", function () {
    const tst = parse("f#");
    const result = {type: "note", body: ["f#", undefined, undefined]};
    expectToEqualWithDiff(tst, result);
  });
  it("g0", function () {
    const tst = parse("g0");
    const result = {type: "note", body: ["g", 0, undefined]};
    expectToEqualWithDiff(tst, result);
  });
});

describe('relative notes', function () {
  it("~0", function () {
    const tst = parse("~0");
    expectToEqualWithDiff(tst, {type: "note", body: [undefined, undefined, "0"]});
  });

  it("~-11", function () {
    const tst = parse("~-11");
    expectToEqualWithDiff(tst, {type: "note", body: [undefined, undefined, "-11"]});
  });

  it("~+11", function () {
    const tst = parse("~+11b");
    expectToEqualWithDiff(tst, {type: "note", body: [undefined, undefined, "+11b"]});
  });

  it("~10#", function () {
    const tst = parse("~10#");
    expectToEqualWithDiff(tst, {type: "note", body: [undefined, undefined, "10#"]});
  });
});

describe('static interpretation of clef', function () {
  // it("~(G4, sine(~2))", async function () {
  //   const tst = await staticInterpret("~(G4, sine(~2))");
  //   console.log(tst);
  //   const res = {
  //     "type": "~",
  //     "body": [
  //       {
  //         "type": "note",
  //         "body": [
  //           "g",
  //           4
  //         ]
  //       },
  //       {
  //         "type": "sine",
  //         "body": [
  //           {
  //             "type": "note",
  //             "body": [
  //               "~",
  //               "2"
  //             ]
  //           }
  //         ]
  //       }
  //     ],
  //     "clefKey": {
  //       "type": "note",
  //       "body": [
  //         "g",
  //         4
  //       ]
  //     },
  //     "clef": {
  //       "0": [],
  //       "1": [],
  //       "2": [],
  //       "3": [],
  //       "4": [],
  //       "5": [],
  //       "6": [],
  //       "7": [],
  //       "8": [],
  //       "9": [],
  //       "10": [],
  //       "11": []
  //     }
  //   };
  //   expect(deepDiff(tst, res)).to.be.true;
  // });
});

// describe('dynamic interpretation of clef', function () {
//   it("~(G4, sine(A4))", async function () {
//     const tst = await interpret("~(G4, sine(A4))", new AudioContext());
//     const res = {
//       "type": "~",
//       "body": [
//         {
//           "type": "note",
//           "body": [
//             "g",
//             4
//           ]
//         },
//         {
//           "type": "sine",
//           "body": [
//             {
//               "type": "note",
//               "body": [
//                 "a",
//                 4
//               ]
//             }
//           ]
//         }
//       ],
//       "clefKey": {
//         "type": "note",
//         "body": [
//           "g",
//           4
//         ]
//       },
//       "clef": {
//         "0": [],
//         "1": [],
//         "2": [],
//         "3": [],
//         "4": [],
//         "5": [],
//         "6": [],
//         "7": [],
//         "8": [],
//         "9": [],
//         "10": [],
//         "11": []
//       }
//     };
//     expect(deepDiff(tst, res)).to.be.true;
//   });
// });

// describe('keys', function () {
//   it("G~C#4", function () {
//     const tst = parse("G~C#4");
//     const result = {type: "note", body: ["C#", 4]};
//     expectToEqualWithDiff(tst, result);
//   });
// });