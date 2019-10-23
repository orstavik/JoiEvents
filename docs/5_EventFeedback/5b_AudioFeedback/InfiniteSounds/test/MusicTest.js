import {parse} from "../Parser2.js";

describe('absolute notes', function () {
  it("C#4", function () {
    const tst = parse("C#4");
    const result = {type: "note", body: ["c#", 4]};
    expect(tst).to.deep.equal(result);
  });
  it("A5", function () {
    const tst = parse("A5");
    const result = {type: "note", body: ["a", 5]};
    expect(tst).to.deep.equal(result);
  });
  it("Bb5", function () {
    const tst = parse("Bb5");
    const result = {type: "note", body: ["bb", 5]};
    expect(tst).to.deep.equal(result);
  });
  it("D#-2", function () {
    const tst = parse("D#-2");
    const result = {type: "note", body: ["d#", -2]};
    expect(tst).to.deep.equal(result);
  });
  it("E", function () {
    const tst = parse("E");
    const result = {type: "note", body: ["e", undefined]};
    expect(tst).to.deep.equal(result);
  });
  it("f#", function () {
    const tst = parse("f#");
    const result = {type: "note", body: ["f#", undefined]};
    expect(tst).to.deep.equal(result);
  });
  it("g0", function () {
    const tst = parse("g0");
    const result = {type: "note", body: ["g", 0]};
    expect(tst).to.deep.equal(result);
  });
});

describe('relative notes', function () {
  it("~0", function () {
    const tst = parse("~0");
    expect(tst).to.deep.equal({type: "note", body: ["~", "0"]});
  });

  it("~-11", function () {
    const tst = parse("~-11");
    expect(tst).to.deep.equal({type: "note", body: ["~", "-11"]});
  });

  it("~+11", function () {
    const tst = parse("~+11b");
    expect(tst).to.deep.equal({type: "note", body: ["~", "+11b"]});
  });

  it("~10#", function () {
    const tst = parse("~10#");
    expect(tst).to.deep.equal({type: "note", body: ["~", "10#"]});
  });
});

// describe('keys', function () {
//   it("G~C#4", function () {
//     const tst = parse("G~C#4");
//     const result = {type: "note", body: ["C#", 4]};
//     expect(tst).to.deep.equal(result);
//   });
// });