import {parse} from "../Parser.js";
import {staticInterpret} from "../Interpreter.js";

describe('basic arrays', function () {

  it("x:y:z", function () {
    const tst = parse('x:y:z');
    const result = {
      type: ":",
      body: [{
        type: ":",
        body: [{type: "x", body: []}, {type: "y", body: []}]
      },
        {type: "z", body: []}]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("x:y:z - syntax interpreted", async function () {
    const tst2 = await staticInterpret('x:y:z');
    const result2 = {
      type: "[]", body: [
        {type: "x", body: []},
        {type: "y", body: []},
        {type: "z", body: []}
      ]
    };
    // result2['isDirty'] = 1;
    expectToEqualWithDiff(tst2.body[0], result2);
  });

  it("[x,y,z]", function () {
    const tst = parse('[x,y,z]');
    const result = {
      type: "[]", body: [
        {type: "x", body: []},
        {type: "y", body: []},
        {type: "z", body: []}
      ]
    };
    // result['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("[x:y:z]", function (done) {
    const tst = parse('[x:y:z]');
    const result = {
      type: "[]", body: [{
        type: ":",
        body: [{
          type: ":",
          body: [{type: "x", body: []}, {type: "y", body: []}]
        },
          {type: "z", body: []}]
      }]
    };
    // result['isDirty'] = 1;
    // result[0].body[0].body.isDirty = 1;
    // result[0].body.isDirty = 1;
    expectToEqualWithDiff(tst, result);
    done();
  });

  it("[x:y:z] - syntax interpreted", async function () {
    const tst2 = await staticInterpret('[x:y:z]');
    const result2 = {
      type: "[]", body: [
        {
          type: "[]", body: [
            {type: "x", body: []},
            {type: "y", body: []},
            {type: "z", body: []}
          ]
        }
      ]
    };
    // result2['isDirty'] = 1;
    // result2[0]['isDirty'] = 1;
    expectToEqualWithDiff(tst2.body[0], result2);
  });

  it("[]", function () {
    const tst = parse('[]');
    expectToEqualWithDiff(tst, []);
  });
});

//
// // WRONG
// describe('basic ()', function () {
//   it("()", function () {
//     const tst = parse('()');
//     expectToEqualWithDiff(tst, undefined);
// });
// });

describe('basic pipe and bar', function () {
  it("x > y > z", function () {
    const tst = parse('x > y > z');
    const result = {
      type: ">",
      body: [{
        type: ">",
        body: [{type: "x", body: []}, {type: "y", body: []}]
      },
        {type: "z", body: []}]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("x | y | z", function () {
    const tst = parse('x | y | z');
    const result = {
      type: "|",
      body: [{
        type: "|",
        body: [{type: "x", body: []}, {type: "y", body: []}]
      },
        {type: "z", body: []}]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });
});

describe('basic wrapped', function () {
  it("(x > y > z)", function () {
    const tst = parse('(x > y > z)');
    const result = {
      type: ">",
      body: [{
        type: ">",
        body: [{type: "x", body: []}, {type: "y", body: []}]
      },
        {type: "z", body: []}]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("(x | y | z)", function () {
    const tst = parse('(x | y | z)');
    const result = {
      type: "|",
      body: [
        {
          type: "|",
          body: [{type: "x", body: []}, {type: "y", body: []}]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("fn(x,y,z)", function () {
    const tst = parse('fn(x,y,z)');
    const result = {
      type: "fn",
      body: [
        {type: "x", body: []},
        {type: "y", body: []},
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });
});

describe('missing arguments', function () {
  it("x > > z", function () {
    const tst = parse('x > > z');
    const result = {
      type: ">",
      body: [
        {
          type: ">",
          body: [{type: "x", body: []}, undefined]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;

    expectToEqualWithDiff(tst, result);
  });

  it(" > y > z", function () {
    const tst = parse(' > y > z');
    const result = {
      type: ">",
      body: [
        {
          type: ">",
          body: [undefined, {type: "y", body: []}]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("x | | z", function () {
    const tst = parse('x | | z');
    const result = {
      type: "|",
      body: [
        {
          type: "|",
          body: [{type: "x", body: []}, undefined]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("x ||| z", function () {
    const tst = parse('x ||| z');
    const result = {
      type: "|",
      body: [
        {
          type: "|",
          body: [
            {
              type: "|",
              body: [{type: "x", body: []}, undefined]
            },
            undefined
          ]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    // result.body[0].body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it(" | y | z", function () {
    const tst = parse(' | y | z');
    const result = {
      type: "|",
      body: [
        {
          type: "|",
          body: [undefined, {type: "y", body: []}]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });


  it("x | y ||||", function () {
    const tst = parse('x | y ||||');
    const result = {
      type: "|",
      body: [{
        type: "|",
        body: [{
          type: "|",
          body: [{
            type: "|",
            body: [{
              type: "|",
              body: [{type: "x", body: []}, {type: "y", body: []}]
            }, undefined]
          }, undefined]
        }, undefined]
      }, undefined]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    // result.body[0].body[0].body['isDirty'] = 1;
    // result.body[0].body[0].body[0].body['isDirty'] = 1;
    // result.body[0].body[0].body[0].body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("x::z", function () {
    const tst = parse('x::z');
    const result = {
      type: ":",
      body: [
        {
          type: ":",
          body: [{type: "x", body: []}, undefined]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it(":y:z", function () {
    const tst = parse(':y:z');
    const result = {
      type: ":",
      body: [
        {
          type: ":",
          body: [undefined, {type: "y", body: []}]
        },
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("x:y:", function () {
    const tst = parse('x:y:');
    const result = {
      type: ":",
      body: [
        {
          type: ":",
          body: [{type: "x", body: []}, {type: "y", body: []}]
        },
        undefined
      ]
    };
    // result.body['isDirty'] = 1;
    // result.body[0].body['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("[x,,z]", function () {
    const tst = parse('[x,,z]');
    const result = {
      type: "[]", body: [
        {type: "x", body: []},
        undefined,
        {type: "z", body: []}
      ]
    };
    // result['isDirty'] = 1;
    expectToEqualWithDiff(tst, result);
  });

  it("[,y,z]", function () {
    const tst = parse('[,y,z]');
    const result = {
      type: "[]", body: [undefined,
        {type: "y", body: []},
        {type: "z", body: []}
      ]
    };
    // result['isDirty'] = 1;

    expectToEqualWithDiff(tst, result);
  });

  it("[x,y,]", function () {
    const tst = parse('[x,y,]');
    const result = {
      type: "[]", body: [
        {type: "x", body: []},
        {type: "y", body: []},
        undefined
      ]
    };
    // result['isDirty'] = 1;

    expectToEqualWithDiff(tst, result);
  });

  it("fn(x,,z)", function () {
    const tst = parse('fn(x,,z)');
    const result = {
      type: "fn",
      body: [
        {type: "x", body: []},
        undefined,
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;

    expectToEqualWithDiff(tst, result);
  });

  it("fn(,y,z)", function () {
    const tst = parse('fn(,y,z)');
    const result = {
      type: "fn",
      body: [
        undefined,
        {type: "y", body: []},
        {type: "z", body: []}
      ]
    };
    // result.body['isDirty'] = 1;

    expectToEqualWithDiff(tst, result);
  });

  it("fn(x,y,)", function () {
    const tst = parse('fn(x,y,)');
    const result = {
      type: "fn",
      body: [
        {type: "x", body: []},
        {type: "y", body: []},
        undefined,
      ]
    };
    // result.body['isDirty'] = 1;

    expectToEqualWithDiff(tst, result);
  });
});
//
// describe('todo: should these become errors in syntactic interpretation?', function () {
//   it(":y:z", function (done) {
//     // try {
//     //   const tst = parse(':y:z');
//     // } catch (e) {
//     //  todo should this be a url?
//     // expectToEqualWithDiff(e.message,"Illegal end of colon implied list: ','.");
//     done();
//     // }
//   });
//   it("x:y:", function (done) {
//     // try {
//     //   const tst = parse(':y:z');
//     // } catch (e) {
//     // expectToEqualWithDiff(e.message,"Illegal end of colon implied list, missing final argument.");
//     done();
//     // }
//   });
// });

