import {interpret} from "../Interpreter3.js";

describe('audio - interpreted', function () {

  it("sine(144)", async function () {
    const tst2 = await interpret('sine(144)');
    expect(tst2).to.be.an.instanceof(AudioNode);
    expect(tst2.frequency.value).to.be.equal(144);
  });
});

describe('audio - error', function () {
  // it("illegal negative step: random (1,25, -0.5)", function () {
  //   try {
  //     staticInterpret('random(1,25, -0.5)');
  //   } catch (e) {
  //     expect(e.message).to.be.equal("Random function broken, illegal parameter: step must be a positive number-0.5");
  //   }
  // });
});
