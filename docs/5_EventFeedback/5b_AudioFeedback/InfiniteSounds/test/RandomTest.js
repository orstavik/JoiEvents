import {staticInterpret} from "../Interpreter3.js";

describe('random - interpreted', function () {

  const randomArray = Array.from({length: 40}, () => Math.random() * 40);

  it("random([13,27,31])", function () {
    const tst2 = staticInterpret('random([13,27,31])');
    const alternatives = [13, 27, 31];
    expect(alternatives).to.include(tst2);
  });
  it("random(randomArray)", function () {
    let str = 'random([' + randomArray + '])';
    for (let x of randomArray) {              //test it 40 times
      let tst2 = staticInterpret(str);
      expect(randomArray).to.include(tst2);
    }
  });
  it("random(25)", function () {
    const tst2 = staticInterpret('random(25)');
    assert(tst2 >= 0 && tst2 <= 25);
    console.log("random(25): " + tst2);
  });
  it("random(12,25)", function () {
    const tst2 = staticInterpret('random(12,25)');
    assert(tst2 >= 12 && tst2 <= 25);
    console.log("random(12,25): " + tst2);
  });
  it("random(12,25, 0.5)", function () {
    const tst2 = staticInterpret('random(12,25, 0.5)');
    assert(tst2 >= 12 && tst2 <= 25 && (tst2 % 0.5 === 0));
    console.log("random(12,25): " + tst2);
  });
  it("random(,25, 0.5)", function () {
    const tst2 = staticInterpret('random(12,25, 0.5)');
    assert(tst2 >= 12 && tst2 <= 25 && (tst2 % 0.5 === 0));
    console.log("random(12,25): " + tst2);
  });
  //todo test for negative numbers for a and b, make a random test for the other random values
});

describe('random - error', function () {
  it("illegal negative step: random (1,25, -0.5)", function () {
    try {
      staticInterpret('random(1,25, -0.5)');
    } catch (e) {
      expect(e.message).to.be.equal("Random function broken, illegal parameter: step must be a positive number-0.5");
    }
  });
});
