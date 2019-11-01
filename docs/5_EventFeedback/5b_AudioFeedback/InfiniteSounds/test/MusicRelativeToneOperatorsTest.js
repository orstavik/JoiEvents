import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('relative notes */ num', function () {

  it("C#4lyd*2", async function () {
    const str = "C#4lyd*2";
    const tst = parse(str);
    const result = {
      type: "*",
      body: [
        {type: "absNote", body: [1, 4, "lyd", 0, "C#4lyd"]},
        2
      ]
    };
    result.body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    const tst2 = await staticInterpret(str);
    const result2 = {type: "absNoteNum", body: [61, "lyd", 0]};
    expectToEqualWithDiff(tst2, result2);
  });
});