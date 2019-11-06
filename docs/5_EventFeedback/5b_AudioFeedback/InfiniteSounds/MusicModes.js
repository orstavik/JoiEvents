const modeVectors = [
  [0, 1, 3, 5, 6, 8, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 9, 10],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 4, 6, 7, 9, 11],
];

//freeze all mode vectors so no one alters them by mistake.
for (let vec of modeVectors)
  Object.freeze(vec);

const modeNameToNumber = {
  "loc": 0,
  "phr": 1,
  "aeo": 2,
  "dor": 3,
  "mix": 4,
  "ion": 5,
  "lyd": 6,

  "maj": 5,
  "min": 2,
};

const modeNumberToName = ["loc", "phr", "aeo", "dor", "mix", "ion", "lyd"];

export class MusicModes {

  //defaults to major/ionian if not a valid name or number.
  static getVector(nameOrNum) {
    typeof nameOrNum === "string" && (nameOrNum = modeNameToNumber[nameOrNum]);
    nameOrNum === undefined && (nameOrNum = 5);           //undefined yields 5, major ionian
    return modeVectors[nameOrNum];
  }

  static getName(num) {
    return modeNumberToName[num];
  }

  //defaults to maj ionian
  static getNumber(name) {
    return name === undefined ? 5 : modeNameToNumber[name];
  }

  static extractSevenNotes(twelveStep, modeVector) {
    const scale = Math.floor(twelveStep / 12);
    twelveStep = ((twelveStep % 12) + 12) % 12;
    let seven = modeVector.indexOf(twelveStep);
    if (seven >= 0)
      return {seven: seven + scale * 7, twelve: 0};
    seven = modeVector.indexOf(twelveStep - 1);
    if (seven >= 0)
      return {seven: seven + scale * 7, twelve: 1};
    throw new Error("twelveStep out of bounds");
  }

  static splitSevenTwelveScale(distInTwelve, mode) {
    if (distInTwelve === 0)
      return {seven: 0, twelve: 0};
    const modeVector = MusicModes.getVector(mode);
    return MusicModes.extractSevenNotes(distInTwelve, modeVector);
  }

  //this function turns converts the distance between two modes to the nearest interval,
  //thus sometimes causing the key to go up or down a hash (twelve step).
  static convertToNearestModeDistance(distance) {
    if (distance < -3)
      return {distance: 7 + distance, hash: 1};
    if (distance > 3)
      return {distance: -7 + distance, hash: -1};
    return {distance, hash: 0};
  }

  static absoluteModeDistance(clefMode, childMode) {
    return MusicModes.getNumber(childMode) - MusicModes.getNumber(clefMode);
  }

  static isModeName(name) {
    return modeNameToNumber.hasOwnProperty(name);
  }
}