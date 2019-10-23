import {parse} from "../Parser2.js";
import {staticInterpret} from "../Interpreter3.js";

describe('parse mhz, hz, s, ms', function () {
  it("12hz", function () {
    const tst = parse('12hz');
    expect(tst).to.deep.equal({type: "hz", body: [12]});
  });
  it("12Mhz", function () {
    const tst = parse('12Mhz');
    expect(tst).to.deep.equal({type: "Mhz", body: [12]});
  });
  it("12s", function () {
    const tst = parse('12s');
    expect(tst).to.deep.equal({type: "s", body: [12]});
  });
  it("12Ms", function () {
    const tst = parse('12Ms');
    expect(tst).to.deep.equal({type: "Ms", body: [12]});
  });
});

describe('interpret mhz, hz, s, ms', function () {
  it("12hz", async function () {
    const tst = await staticInterpret('12hz');
    expect(tst).to.deep.equal(12);
  });
  it("12Mhz", async function () {
    const tst = await staticInterpret('12Mhz');
    expect(tst).to.deep.equal(12000);
  });
  it("12s", async function () {
    const tst = await staticInterpret('12s');
    expect(tst).to.deep.equal(12);
  });
  it("12Ms", async function () {
    const tst = await staticInterpret('12Ms');
    expect(tst).to.deep.equal(0.012);
  });
});

