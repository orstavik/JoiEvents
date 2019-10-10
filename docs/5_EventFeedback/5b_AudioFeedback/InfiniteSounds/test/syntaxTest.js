import {parse} from "../Parser.js";

describe('pipe', function () {
  it("a > b > c", function () {
    const tst  = parse('a > b > c');
    const result = JSON.parse('{"type":">","args":[{"type":"a"},{"type":"b"},{"type":"c"}]}');
    expect(tst).to.deep.equal(result);
  });
});

describe('--css-var', function () {
  it("a > b > c", function () {
    const tst  = parse('a > b > c');
    const result = JSON.parse('{"type":">","args":[{"type":"a"},{"type":"b"},{"type":"c"}]}');
    expect(tst).to.deep.equal(result);
  });
});