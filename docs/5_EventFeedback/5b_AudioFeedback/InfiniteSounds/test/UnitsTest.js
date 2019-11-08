import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('Units: parse mhz, hz, s, ms', function () {
  it("12hz", function () {
    const tst = parse('12hz');
    expectToEqualWithDiff(tst, {type: "hz", body: [12]});
  });
  it("12Mhz", function () {
    const tst = parse('12Mhz');
    expectToEqualWithDiff(tst, {type: "mhz", body: [12]});
  });
  it("12s", function () {
    const tst = parse('12s');
    expectToEqualWithDiff(tst, {type: "s", body: [12]});
  });
  it("12Ms", function () {
    const tst = parse('12Ms');
    expectToEqualWithDiff(tst, {type: "ms", body: [12]});
  });
});

describe('Units: interpret mhz, hz, s, ms', function () {
  it("12hz", async function () {
    const tst = await staticInterpret('12hz');
    expectToEqualWithDiff(tst.body[0], 12);
  });
  it("12Mhz", async function () {
    const tst = await staticInterpret('12Mhz');
    expectToEqualWithDiff(tst.body[0], 12000);
  });
  it("12s", async function () {
    const tst = await staticInterpret('12s');
    expectToEqualWithDiff(tst.body[0], 12);
  });
  it("12Ms", async function () {
    const tst = await staticInterpret('12Ms');
    expectToEqualWithDiff(tst.body[0],  0.012);
  });
});
