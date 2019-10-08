const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const minors = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};

const modeNames = [
  "locrian",
  "phrygian",
  "aeolian",
  "dorian",
  "mixolydian",
  "ionian",
  "lydian"
];

const altModeName = {
  minor: "aeolian",
  major: "ionian"
};

function getNoteNumber(name) {
  let key, octave;
  if (name[1] === "b" || name[1] === "#") {
    key = name[0] + name[1];
    octave = name.substring(2);
  }
  else {
    key = name[0];
    octave = name.substring(1);
  }
  key = minors[key] || key;
  if (!notes[key])
    throw new SyntaxError("A note name must be on the form 'C', 'D#', 'Eb', 'C4', or 'D#3'.");
  //todo add efficient test for checking that octave is a positive integer.
  return notes[key] + parseInt(octave) * 12;
}

function getModeNumbers(mode) {
  if (!mode)        //Ionian/major is default
    return 6;
  if (mode instanceof Number)
    return mode;    //already a number
  if (typeof mode === "string") {
    let str = mode.toLowerCase();
    str = altModeName[str] || str;   //replace major and minor
    const num = modeNames.indexOf(str);
    if (num === -1)
      throw new SyntaxError("Illegal music mode: " + mode);
    return num;
  }
  throw new SyntaxError("Illegal music mode: " + mode);
}

function getKeyModeNumbers (coor) {
  coor = coor instanceof Array ? coor : [coor, undefined];
  const startKey = getNoteNumber(coor[0]);
  const startMode = getModeNumbers(coor[1]);
  return [startKey, startMode];
}

function circleOfFifth(coor, key, mode) {
  const [startKey, startMode] = getKeyModeNumbers(coor);
  const morphKey = startKey + (key * 7);
  const morphMode = startMode + mode;
  const addedKeys = Math.floor(morphMode / 7);
  const endMode = morphMode % 7;
  return [morphKey + addedKeys, endMode];       //todo return a proper coordinate
}

const modeScales = [
  [0, 1, 3, 5, 6, 8, 10],
  [0, 1, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 3, 5, 7, 9, 10],
  [0, 2, 4, 5, 7, 9, 10],
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 4, 6, 7, 9, 11]
];

function absoluteTonePosition(scale, pos) {
  return scale[pos % 7] + Math.floor(pos / 7) * 12;
}

export class ScaleFunctions {
  static circle5(ctx, coor, key, mode) {
    debugger;
    return circleOfFifth(coor, key, mode);
  }
  static scale(coor) {
    const [note, mode] = getKeyModeNumbers(coor);
    return modeScales[mode].map(pos => note + pos);
  }

  static chord(coor, notes) {
    const [note, mode] = getKeyModeNumbers(coor);
    const scale = modeScales[mode];
    return notes.map(pos => absoluteTonePosition(scale, pos) + note);
  }

  static makeChord(coor, count, skips) {
    const notes = [];
    for (let i = 0; count--; i += skips)
      notes.push(i);
    return chord(coor, notes);
  }
}