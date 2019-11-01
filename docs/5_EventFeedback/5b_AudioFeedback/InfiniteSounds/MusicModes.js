const modeVectors = [
  [0, 1, 3, 5, 6, 8, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 9, 10],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 4, 6, 7, 9, 11],
];

const modeNameToVector = {
  "loc": [0, 1, 3, 5, 6, 8, 10],
  "phr": [0, 1, 3, 5, 7, 8, 10],
  "aeo": [0, 2, 3, 5, 7, 8, 10],
  "dor": [0, 2, 3, 5, 7, 9, 10],
  "mix": [0, 2, 4, 5, 7, 9, 10],
  "ion": [0, 2, 4, 5, 7, 9, 11],
  "lyd": [0, 2, 4, 6, 7, 9, 11],
};
modeNameToVector["maj"] = modeNameToVector["ion"];
modeNameToVector["min"] = modeNameToVector["aeo"];

//freeze all mode vectors so noone alters them by mistake.
for (let vec of modeVectors)
  Object.freeze(vec);
for (let name in modeNameToVector)
  Object.freeze(modeNameToVector[name]);

const modeNameToNumber = {
  "loc": 0,
  "phr": 1,
  "aeo": 2,
  "dor": 3,
  "mix": 4,
  "ion": 5,
  "lyd": 6,
};
modeNameToNumber["maj"] = modeNameToNumber["ion"];
modeNameToNumber["min"] = modeNameToNumber["aeo"];

const modeNumberToName = ["loc", "phr", "aeo", "dor", "mix", "ion", "lyd"];

export class MusicModes {

  static getVector(nameOrNum) {
    return Number.isInteger(nameOrNum) ?
      modeVectors[nameOrNum] :
      modeNameToVector[nameOrNum];
  }

  static getName(num) {
    return modeNumberToName[num];
  }

  static getNumber(name) {
    return modeNameToNumber[name];
  }
}