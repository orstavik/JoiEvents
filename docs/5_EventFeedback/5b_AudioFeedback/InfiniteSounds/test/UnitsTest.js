import {parse} from "../Parser2.js";
import {staticInterpret} from "../Interpreter3.js";

describe('parse mhz, hz, s, ms', function () {
  it("12hz", function () {
    const tst = parse('12hz');
    expect(deepDiff(tst, {type: "hz", body: [12]})).to.be.true;
  });
  it("12Mhz", function () {
    const tst = parse('12Mhz');
    expect(deepDiff(tst, {type: "mhz", body: [12]})).to.be.true;
  });
  it("12s", function () {
    const tst = parse('12s');
    expect(deepDiff(tst, {type: "s", body: [12]})).to.be.true;
  });
  it("12Ms", function () {
    const tst = parse('12Ms');
    expect(deepDiff(tst, {type: "ms", body: [12]})).to.be.true;
  });
});

describe('interpret mhz, hz, s, ms', function () {
  it("12hz", async function () {
    const tst = await staticInterpret('12hz');
    expect(deepDiff(tst, 12)).to.be.true;
  });
  it("12Mhz", async function () {
    const tst = await staticInterpret('12Mhz');
    expect(deepDiff(tst, 12000)).to.be.true;
  });
  it("12s", async function () {
    const tst = await staticInterpret('12s');
    expect(deepDiff(tst, 12)).to.be.true;
  });
  it("12Ms", async function () {
    const tst = await staticInterpret('12Ms');
    expect(deepDiff(tst, 0.012)).to.be.true;
  });
});

