import {interpret} from "../Interpreter.js";

describe('random - interpreted', function () {

  const randomArray = Array.from({length: 40}, () => Math.random() * 40);

  it("random([13,27,31])", async function () {
    const tst2 = await interpret('random([13,27,31])', new AudioContext());
    const alternatives = [13, 27, 31];
    expect(tst2).to.be.oneOf(alternatives);
  });
  it("random([13,27,31])+1", async function () {
    const tst2 = await interpret('random([13,27,31])+1', new AudioContext());
    const alternatives = [14, 28, 32];
    expect(tst2).to.be.oneOf(alternatives);
  });
  it("random(randomArray) 40 times", async function () {
    let str = 'random([' + randomArray + '])';
    for (let x of randomArray) {
      let tst2 = await interpret(str, new AudioContext());
      expect(tst2).to.be.oneOf([tst2]);
    }
  });
  it("random(25)", async function () {
    const tst2 = await interpret('random(25)', new AudioContext());
    assert(tst2 >= 0 && tst2 <= 25);
    console.log("random(25): " + tst2);
  });
  it("random(12,25)", async function () {
    const tst2 = await interpret('random(12,25)', new AudioContext());
    assert(tst2 >= 12 && tst2 <= 25);
    console.log("random(12,25): " + tst2);
  });
  it("random(12,25, 0.5)", async function () {
    const tst2 = await interpret('random(12,25, 0.5)', new AudioContext());
    assert(tst2 >= 12 && tst2 <= 25 && (tst2 % 0.5 === 0));
    console.log("random(12,25): " + tst2);
  });
  it("random(,25, 0.5)", async function () {
    const tst2 = await interpret('random(12,25, 0.5)', new AudioContext());
    assert(tst2 >= 12 && tst2 <= 25 && (tst2 % 0.5 === 0));
    console.log("random(12,25): " + tst2);
  });
  //todo test for negative numbers for a and b, make a random test for the other random values
});

describe('random - error', function () {
  it("illegal negative step: random (1,25, -0.5)", async function () {
    try {
      await interpret('random(1,25, -0.5)', new AudioContext());
    } catch (e) {
      expect(e.message).to.be.equal("Random function broken, illegal parameter: step must be a positive number-0.5");
    }
  });
});
