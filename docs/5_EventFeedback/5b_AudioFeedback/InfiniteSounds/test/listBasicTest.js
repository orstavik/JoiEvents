import {parse} from "../Parser.js";

describe('basic implied', function () {
  it("x > y > z", function () {
    const tst = parse('x > y > z');
    const result = {
      type: ">",
      args: [{
        type: "x"
      }, {
        type: "y"
      }, {
        type: "z"
      }]
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | y | z", function () {
    const tst = parse('x | y | z');
    const result = {
      type: "|",
      args: [{
        type: "x"
      }, {
        type: "y"
      }, {
        type: "z"
      }]
    };
    expect(tst).to.deep.equal(result);
  });

  it("x:y:z", function () {
    const tst = parse('x:y:z');
    const result = [{
      type: "x"
    }, {
      type: "y"
    }, {
      type: "z"
    }];
    expect(tst).to.deep.equal(result);
  });
});

describe('basic wrapped', function () {
  it("(x > y > z)", function () {
    const tst = parse('(x > y > z)');
    const result = {
      type: ">",
      args: [{
        type: "x"
      }, {
        type: "y"
      }, {
        type: "z"
      }]
    };
    expect(tst).to.deep.equal(result);
  });

  it("{x | y | z}", function () {
    const tst = parse('{x | y | z}');
    const result = {
      type: "|",
      args: [{
        type: "x"
      }, {
        type: "y"
      }, {
        type: "z"
      }]
    };
    expect(tst).to.deep.equal(result);
  });

  it("[x:y:z]", function () {
    const tst = parse('[x:y:z]');
    const result = [[{
      type: "x"
    }, {
      type: "y"
    }, {
      type: "z"
    }]];
    expect(tst).to.deep.equal(result);
  });

  it("[x,y,z]", function () {
    const tst = parse('[x,y,z]');
    const result = [{
      type: "x"
    }, {
      type: "y"
    }, {
      type: "z"
    }];
    expect(tst).to.deep.equal(result);
  });

  it("fn(x,y,z)", function () {
    const tst = parse('fn(x,y,z)');
    const result = {
      type: "fn",
      args: [{
        type: "x"
      }, {
        type: "y"
      }, {
        type: "z"
      }]
    };
    expect(tst).to.deep.equal(result);
  });
});

describe('missed arguments', function () {
  it("x > > z", function () {
    const tst = parse('x > > z');
    const result = {
      type: ">",
      args: [
        {type: "x"},
        null,
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it(" > y > z", function () {
    const tst = parse(' > y > z');
    const result = {
      type: ">",
      args: [
        null,
        {type: "y"},
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | | z", function () {
    const tst = parse('x | | z');
    const result = {
      type: "|",
      args: [
        {type: "x"},
        null,
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("x ||| z", function () {
    const tst = parse('x ||| z');
    const result = {
      type: "|",
      args: [
        {type: "x"},
        null,
        null,
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it(" | y | z", function () {
    const tst = parse(' | y | z');
    const result = {
      type: "|",
      args: [
        null,
        {type: "y"},
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("x | y ||||", function () {
    const tst = parse('x | y ||||');
    const result = {
      type: "|",
      args: [
        {type: "x"},
        {type: "y"},
        null,
        null,
        null,
        null
      ]
    };
    expect(tst).to.deep.equal(result);
  });

  it("x::z", function () {
    const tst = parse('x::z');
    const result = [
      {type: "x"},
      null,
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

  it(":y:z", function () {
    const tst = parse('x::z');
    const result = [
      {type: "x"},
      null,
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

  it("[x,,z]", function () {
    const tst = parse('[x,,z]');
    const result = [
      {type: "x"},
      null,
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

  //todo max1 add spaces for the other tests like the one below
  it("[,y,z]", function () {
    const tst = parse('[,y,z]');
    const tst2 = parse('[ ,y,z]');
    const result = [
      null,
      {type: "y"},
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
    expect(tst2).to.deep.equal(result);
  });

  it("[x,y,]", function () {
    const tst = parse('[x,y,]');
    const tst2 = parse('[x,y,  ]');
    const result = [
      {type: "x"},
      {type: "y"},
      null
    ];
    expect(tst).to.deep.equal(result);
    expect(tst2).to.deep.equal(result);
  });

  it("fn(x,,z)", function () {
    const tst = parse('fn(x,,z)');
    const tst2 = parse('fn(x,  ,z)');
    const result = {
      type: "fn",
      args: [
        {type: "x"},
        null,
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
    expect(tst2).to.deep.equal(result);
  });

  it("fn(,y,z)", function () {
    const tst = parse('fn(,y,z)');
    const tst2 = parse('fn(  , y , z)');
    const result = {
      type: "fn",
      args: [
        null,
        {type: "y"},
        {type: "z"}
      ]
    };
    expect(tst).to.deep.equal(result);
    expect(tst2).to.deep.equal(result);
  });

  it("fn(x,y,)", function () {
    const tst = parse('fn(x,y,)');
    const tst2 = parse('fn( x , y , )');
    const result = {
      type: "fn",
      args: [
        {type: "x"},
        {type: "y"},
        null
      ]
    };
    expect(tst).to.deep.equal(result);
    expect(tst2).to.deep.equal(result);
  });

  it("x: :z", function () {
    const tst = parse('x: :z');
    const result = [
      {type: "x"},
      null,
      {type: "z"}
    ];
    expect(tst).to.deep.equal(result);
  });

});

describe('errors', function () {
  it(":y:z", function () {
    try {
      const tst = parse(':y:z');
    } catch (e) {
      //todo should this be a url?
      expect(e.message).to.deep.equal("Illegal end of colon implied list: ','.");
    }
  });
  it("x:y:", function () {
    try {
      const tst = parse(':y:z');
    } catch (e) {
      //todo should this be a url?
      expect(e.message).to.deep.equal("Illegal end of colon implied list, missing final argument.");
    }
  });
});

