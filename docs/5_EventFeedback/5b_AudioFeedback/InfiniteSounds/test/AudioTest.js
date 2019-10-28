import {interpret} from "../Interpreter.js";

describe('audio - interpreted', function () {

  it("sine(144)", async function () {
    // const graph = staticInterpret('sine(144)');
    // console.log(JSON.stringify(graph, null, 2));
    const graph = {
      type: "sine",
      body: [144]
    };
    const tst2 = await interpret('sine(144)', new AudioContext());
    expect(tst2.output).to.be.an.instanceof(AudioNode);
    expect(tst2.output.frequency.value).to.be.equal(144);
    expect(tst2.input).to.be.equal(undefined);
    expect(tst2.graph).to.deep.equal(graph);
  });

  it("sine(144) > gain(0.2)", async function () {
    let tstString = 'sine(440) > gain(0.2)';
    // const graph = staticInterpret(tstString);
    //console.log(JSON.stringify(graph, null, 2));
    const graph1 = {
      type: "sine",
      body: [440]
    };
    const graph2 = {
      type: "gain",
      body: [0.2]
    };
    const tst2 = await interpret(tstString, [new AudioContext()]);
    expect(tst2.graph.body[0].graph).to.deep.equal(graph1);
    expect(tst2.graph.body[1].graph).to.deep.equal(graph2);
    expect(tst2.input).to.be.an.instanceof(AudioNode);
    expect(tst2.input.frequency.value).to.be.equal(440);
    expect(tst2.output).to.be.an.instanceof(AudioNode);
    expect(tst2.output.gain.value).to.be.closeTo(0.2, 0.00005);
    expect(tst2.ogInput).to.be.equal(tst2.input);
  });

  it("sine(440) > gain(0.2) > gain(0.1)", async function () {
    let tstString = 'sine(440) > gain(0.2) > gain(0.1)';
    // const graph = staticInterpret(tstString);
    //console.log(JSON.stringify(graph, null, 2));
    const graph1 = {
      type: "sine",
      body: [440]
    };
    const graph2 = {
      type: "gain",
      body: [0.1]
    };
    const tst2 = await interpret(tstString, [new AudioContext()]);
    expect(tst2.graph.body[0].graph.body[0].graph).to.deep.equal(graph1);
    expect(tst2.graph.body[1].graph).to.deep.equal(graph2);
    // expect(tst2.input).to.be.an.instanceof(AudioNode);
    // expect(tst2.input.frequency.value).to.be.equal(440);
    expect(tst2.input).to.be.an.instanceof(GainNode);
    expect(tst2.input.gain.value).to.be.closeTo(0.2, 0.00005);
    expect(tst2.output).to.be.an.instanceof(GainNode);
    expect(tst2.output.gain.value).to.be.closeTo(0.1, 0.00005);
    expect(tst2.ogInput).to.be.an.instanceof(OscillatorNode);
    expect(tst2.ogInput.frequency.value).to.be.equal(440);
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
