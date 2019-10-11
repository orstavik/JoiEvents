import {parse} from "../Parser.js";

describe('pipe', function () {
  it("a > b > c", function () {
    const tst = parse('a > b > c');
    const result = JSON.parse('{"type":">","args":[{"type":"a"},{"type":"b"},{"type":"c"}]}');
    expect(tst).to.deep.equal(result);
  });

  it("a > b > [c, d]", function () {
    const tst = parse('a > b > [c, d]');
    const result = JSON.parse('{"type":">","args":[{"type":"a"},{"type":"b"},[{"type":"c"},{"type":"d"}]]}');
    expect(tst).to.deep.equal(result);
  });
  it("a > (b > c)", function () {
    const tst = parse('a > (b > c)');
    const res = {
      type: ">",
      args: [{
        type: "a",
      }, {
        type: ">",
        args: [{
          type: "b",
        }, {
          type: "c",
        }]
      }]
    };
    expect(tst).to.deep.equal(res);
  });
});

describe('array', function () {
  it('[a,b,c]', function () {
    const tst = parse('[a,b,c]');
    const result = JSON.parse('{"type":">","args":[[{"type":"a"},{"type":"b"},{"type":"c"}]]}');
    expect(tst).to.deep.equal(result);
  });
  it('a > [b, (c > d)]', function () {
    const tst = parse('a > [b, (c > d)]');
    const result = {
      type: ">",
      args: [{
        type: "a",
      }, [{
        type: "b",
      }, {
        type: ">",
        args: [{
          type: "c",
        }, {
          type: "d",
        }]
      }]
      ]
    };
    expect(tst).to.deep.equal(result);
  });
  it('a > ([b, (c > d)])', function () {
    const tst = parse('a > ([b, (c > d)])');
    const result = {
      type: ">",
      args: [{
        type: "a",
      }, [{
        type: "b",
      }, {
        type: ">",
        args: [{
          type: "c",
        }, {
          type: "d",
        }]
      }]
      ]
    };
    expect(tst).to.deep.equal(result);
  });
});


describe('--css-var', function () {
  it("a > --audio-var > c", function () {
    const tst = parse('a > --audio-var > c');
    const result = JSON.parse('{"type":">","args":[{"type":"a"},{"type":"--","varName":"--audio-var"},{"type":"c"}]}');
    expect(tst).to.deep.equal(result);
  });

  it('a > --audio-var > peaking(120hz, 25dB, 1hz)', function () {
    const tst = parse('a > --audio-var > peaking(120hz, 25dB, 1hz)');
    const result = JSON.parse('{"type":">","args":[{"type":"a"},{"type":"--","varName":"--audio-var"},{"type":"peaking","args":[{"type":"num","value":120,"unit":"hz"},{"type":"num","value":25,"unit":"dB"},{"type":"num","value":1,"unit":"hz"}]}]}');
    expect(tst).to.deep.equal(result);
  });
});


describe('filter', function () {
  it("sawtooth(144hz) > lowpass(140hz, 24dB)", function () {
    const tst = parse('sawtooth(144hz) > lowpass(140hz, 24dB)');
    const result = JSON.parse('{"type":">","args":[{"type":"sawtooth","args":[{"type":"num","value":144,"unit":"hz"}]},{"type":"lowpass","args":[{"type":"num","value":140,"unit":"hz"},{"type":"num","value":24,"unit":"dB"}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it("square(144hz) > vol([1/0.0015],[0.6/0.001],[0.6/1],[0/0.03]) > lowpass(180hz, 12dB)", function () {
    const tst = parse('square(144hz) > vol([1/0.0015],[0.6/0.001],[0.6/1],[0/0.03]) > lowpass(180hz, 12dB)');
    const result = JSON.parse('{"type":">","args":[{"type":"square","args":[{"type":"num","value":144,"unit":"hz"}]},{"type":"vol","args":[[[{"type":"num","value":1,"unit":""},{"type":"num","value":0.0015,"unit":""}]],[[{"type":"num","value":0.6,"unit":""},{"type":"num","value":0.001,"unit":""}]],[[{"type":"num","value":0.6,"unit":""},{"type":"num","value":1,"unit":""}]],[[{"type":"num","value":0,"unit":""},{"type":"num","value":0.03,"unit":""}]]]},{"type":"lowpass","args":[{"type":"num","value":180,"unit":"hz"},{"type":"num","value":12,"unit":"dB"}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('triangle(144hz) > peaking(120hz, 25dB, 10hz)', function () {
    const tst = parse('triangle(144hz) > peaking(120hz, 25dB, 10hz)');
    const result = JSON.parse('{"type":">","args":[{"type":"triangle","args":[{"type":"num","value":144,"unit":"hz"}]},{"type":"peaking","args":[{"type":"num","value":120,"unit":"hz"},{"type":"num","value":25,"unit":"dB"},{"type":"num","value":10,"unit":"hz"}]}]}');
    expect(tst).to.deep.equal(result);
  });
});

describe('url', function () {
  it("url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3')", function () {
    const tst = parse("url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3')");
    const result = JSON.parse('{"type":">","args":[{"type":"url","args":["\\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3\\""]}]}');
    expect(tst).to.deep.equal(result);
  });

  it("url(\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3\", 1)", function () {
    const tst = parse('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3", 1)');
    const result = JSON.parse('{"type":">","args":[{"type":"url","args":["\\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3\\"",{"type":"num","value":1,"unit":""}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3") > lowpass(180hz, 12dB)', function () {
    const tst = parse('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3") > lowpass(180hz, 12dB)');
    const result = JSON.parse('{"type":">","args":[{"type":"url","args":["\\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3\\""]},{"type":"lowpass","args":[{"type":"num","value":180,"unit":"hz"},{"type":"num","value":12,"unit":"dB"}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3") > gain([1/0.0015],[0.6/0.001],[0.6/1],[0/0.03]) > lowpass(180hz, 12dB)', function () {
    const tst = parse('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3") > gain([1/0.0015],[0.6/0.001],[0.6/1],[0/0.03]) > lowpass(180hz, 12dB)');
    const result = JSON.parse('{"type":">","args":[{"type":"url","args":["\\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3\\""]},{"type":"gain","args":[[[{"type":"num","value":1,"unit":""},{"type":"num","value":0.0015,"unit":""}]],[[{"type":"num","value":0.6,"unit":""},{"type":"num","value":0.001,"unit":""}]],[[{"type":"num","value":0.6,"unit":""},{"type":"num","value":1,"unit":""}]],[[{"type":"num","value":0,"unit":""},{"type":"num","value":0.03,"unit":""}]]]},{"type":"lowpass","args":[{"type":"num","value":180,"unit":"hz"},{"type":"num","value":12,"unit":"dB"}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3") > [a, b]', function () {
    const tst = parse('url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3") > [a, b]');
    const result = JSON.parse('{"type":">","args":[{"type":"url","args":["\\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3\\""]},[{"type":"a"},{"type":"b"}]]}');
    expect(tst).to.deep.equal(result);
  });

  it('url($1, 1) > $2(A4) > gain($3)', function () {
    const tst = parse('url($1, 1) > $2(A4) > gain($3)');
    const result = JSON.parse('{"type":">","args":[{"type":"url","args":[{"type":"$","varName":"$1"},{"type":"num","value":1,"unit":""}]},{"type":"$","args":[{"type":"A4"}],"varName":"$2"},{"type":"gain","args":[{"type":"$","varName":"$3"}]}]}');
    expect(tst).to.deep.equal(result);
  });
});

describe('Noise', function () {
  it('noise > bandpass(140hz, 12dB, 300hz)', function () {
    const tst = parse('noise > bandpass(140hz, 12dB, 300hz)');
    const result = JSON.parse('{"type":">","args":[{"type":"noise"},{"type":"bandpass","args":[{"type":"num","value":140,"unit":"hz"},{"type":"num","value":12,"unit":"dB"},{"type":"num","value":300,"unit":"hz"}]}]}');
    expect(tst).to.deep.equal(result);
  });
});

describe('Notes', function () {
  it('sine(F4)', function () {
    const tst = parse('sine(F4)');
    const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[{"type":"F4"}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('sine(F#4)', function () {
    const tst = parse('sine(F#4)');
    const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[{"type":"F#4"}]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('sine(F#4/Ionian)', function () {
    const tst = parse('sine(F#4/Ionian)');
    const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[[{"type":"F#4"},{"type":"Ionian"}]]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('sine(F#4/--my-mode)', function () {
    const tst = parse('sine(F#4/--my-mode)');
    const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[[{"type":"F#4"},{"type":"--","varName":"--my-mode"}]]}]}');
    expect(tst).to.deep.equal(result);
  });

  it('sine(F#4/plus(2,2))', function () {
    const tst = parse('sine(F#4/plus(2,2))');
    const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[[{"type":"F#4"},{"type":"plus","args":[{"type":"num","value":2,"unit":""},{"type":"num","value":2,"unit":""}]}]]}]}');
    expect(tst).to.deep.equal(result);
  });

  // it('sine(F#4) > [gain(0.9), convolver() > gain(0.5)]', function () {
  //   const tst = parse('sine(F#4) > [gain(0.9), convolver() > gain(0.5)]');
  //   const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[[{"type":"F#4"},{"type":"plus","args":[{"type":"num","value":2,"unit":""},{"type":"num","value":2,"unit":""}]}]]}]}');
  //   expect(tst).to.deep.equal(result);
  // });
  //
  // it('sine(F#4) > ([gain(0.9), (convolver() > gain(0.5))])', function () {
  //   const tst = parse('sine(F#4) > [gain(0.9), convolver() > gain(0.5)]');
  //   const result = JSON.parse('{"type":">","args":[{"type":"sine","args":[[{"type":"F#4"},{"type":"plus","args":[{"type":"num","value":2,"unit":""},{"type":"num","value":2,"unit":""}]}]]}]}');
  //   expect(tst).to.deep.equal(result);
  // });
});

describe("Error test", function () {
  it('url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3, 1)', function () {
    try {
      const tst = parse('url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3, 1)');
    } catch (e) {
      const result = 'InfiniteSound: Illegal token: ://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/G4.mp3, 1))';
      expect(e.message).to.be.equal(result);

    }
  });
});
