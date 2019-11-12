import {staticInterpret, interpret} from "../Interpreter.js";

describe('random - interpreted', function () {

  it("random([13,27,31])", async function () {
    const tst2 = await interpret('random([13,27,31])', new AudioContext());
    expect([13, 27, 31]).toContain(tst2.body[0]);
  });
  it("random(randomArray) 40 times", async function () {
    const randomArray = Array.from({length: 40}, () => Math.random() * 40);
    let str = 'random([' + randomArray + '])';
    for (let x of randomArray) {
      let tst2 = await interpret(str, new AudioContext());
      expect(randomArray).toContain(tst2.body[0]);
    }
  });
  it("random(25)", async function () {
    const tst2 = await interpret('random(25)', new AudioContext());
    expect(tst2.body[0]).toBeLessThanOrEqual(25);
    expect(tst2.body[0]).toBeGreaterThanOrEqual(0);
  });
  it("random(12,25)", async function () {
    const tst2 = await interpret('random(12,25)', new AudioContext());
    expect(tst2.body[0]).toBeLessThanOrEqual(25);
    expect(tst2.body[0]).toBeGreaterThanOrEqual(12);
  });
  it("random(12,25, 0.5)", async function () {
    const tst2 = await interpret('random(12,25, 0.5)', new AudioContext());
    expect(tst2.body[0]).toBeLessThanOrEqual(25);
    expect(tst2.body[0]).toBeGreaterThanOrEqual(12);
    expect(tst2.body[0] % 0.5).toEqual(0);
  });
  it("random(,25, 0.5)", async function () {
    const tst2 = await interpret('random(,25, 0.5)', new AudioContext());
    expect(tst2.body[0]).toBeLessThanOrEqual(25);
    expect(tst2.body[0]).toBeGreaterThanOrEqual(0);
    expect(tst2.body[0] % 0.5).toEqual(0);
  });
  //todo test for negative numbers for a and b, make a random test for the other random values
});

describe('random - error', function () {
  it("illegal negative step: random (1,25, -0.5)", async function () {
    try {
      await interpret('random(1,25, -0.5)', new AudioContext());
    } catch (e) {
      expect(e.message).toEqual("Random function broken, illegal parameter: step must be a positive number-0.5");
    }
  });
});

describe('LFO - staticInterpreted', function () {

  it("lfo(1, 'square', 0.4, 0.8)", async function () {
    //becomes: [constant(0.4), square(1) > gain(0.4)]
    const tst2 = await staticInterpret('lfo(1, "square", 0.4, 0.8)', new AudioContext());
    const res2 = {
      type: ">",
      body: [
        {
          type: "[]",
          body: [
            {type: "constant", body: [0.4]},
            {
              type: ">",
              body: [
                {type: "square", body: [1]},
                {type: "gain", body: [0.4]}
              ]
            }
          ]
        },
        {type: "gain", body: [1]}
      ]
    };
    expectToEqualWithDiff(tst2.body[0], res2);
  });
});