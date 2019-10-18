import {interpret, staticInterpret} from "../Interpreter3.js";

describe('audio - interpreted', function () {

  it("sine(144)", async function () {
    // const graph = staticInterpret('sine(144)');
    // console.log(JSON.stringify(graph, null, 2));
    const graph = {
      type: "sine",
      body: [
        144
      ]
    };
    const tst2 = await interpret('sine(144)');
    expect(tst2.audio).to.be.an.instanceof(AudioNode);
    expect(tst2.audio.frequency.value).to.be.equal(144);
    expect(tst2.graph).to.deep.equal(graph);
  });

  //todo max: duplicate this type of check for all the oscillators and filters and the other builtin audio nodes (noise, etc.)
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
