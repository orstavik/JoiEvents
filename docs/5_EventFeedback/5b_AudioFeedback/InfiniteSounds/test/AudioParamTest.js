import {interpret} from "../Interpreter3.js";

describe('AudioParam - interpreted', function () {

  it("sine(144)", async function () {
    // const graph = staticInterpret('sine(144)');
    // console.log(JSON.stringify(graph, null, 2));
    const graph = {
      type: "sine",
      body: [144]
    };
    const tst2 = await interpret('sine(144)', new AudioContext());
    expect(tst2.input).to.be.equal(undefined);
    expect(tst2.output).to.be.an.instanceof(OscillatorNode);
    expect(tst2.output.frequency.value).to.be.equal(144);
    expect(tst2.output.gain.value).to.be.equal(1);
    expect(tst2.graph).to.deep.equal(graph);
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
