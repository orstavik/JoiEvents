import {useCases, namesOnly} from "./useCase1.js";

let res;

function result() {
  return res;
}

function makeExpectation(scopedPath) {
  const names = namesOnly(scopedPath.flat(Infinity));
  const bubbleTrail = names.map(name => name.toLowerCase());
  const captureTrail = names.reverse().map(name => name.toUpperCase());
  return captureTrail.join(" ") + " " + bubbleTrail.join(" ") + " ";
}

function makeTest(usecase) {
  return function () {
    res = "";
    const all = usecase().flat(Infinity);
    for (let nameElement of all) {
      let name = Object.getOwnPropertyNames(nameElement)[0];
      let el = Object.values(nameElement)[0];
      el.addEventListener("click", function (e) {
        res += name.toUpperCase() + " ";
      }, true);
      el.addEventListener("click", function (e) {
        res += name.toLowerCase() + " ";
      });
    }
    Object.values(all[0])[0].dispatchEvent(new Event("click", {bubbles: true, composed: true}));
  }
}

export const basicPropTest = [];
//composed and bubbles
for (let useCase of useCases) {
  const expect = makeExpectation(useCase.makeDomBranch());
  basicPropTest.push({
    name: "propagation: bubbles + composed: " + useCase.name,
    fun: makeTest(useCase.makeDomBranch),
    expect,
    result
  });
}
//todo I should pop one of the targets,
//bubbles only
// for (let useCase of useCases) {
//   const expect = makeExpectation(useCase.makeDomBranch());
//   basicPropTest.push({
//     name: "propagation: bubbles + composed: " + useCase.name,
//     fun: makeTest(useCase.makeDomBranch),
//     expect,
//     result
//   });
// }