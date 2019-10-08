const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const modeNames = ["locrian", "phrygian", "aeolian", "dorian", "mixolydian", "ionian", "lydian"];
const minors = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};

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
  let number = notes.indexOf(key);
  if (number === -1)
    throw new SyntaxError("A note name must be on the form 'C', 'D#', 'Eb', 'C4', or 'D#3'.");
  //todo add efficient test for checking that octave is a positive integer.
  return number + parseInt(octave) * 12;
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

function circleOfFifth(startKey, startMode, key = 0, mode = 0) {
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

function parseKeyModeCoordinate(coor) {
  coor = coor instanceof Array ? coor : [coor, undefined];
  const startKey = getNoteNumber(coor[0] ? coor[0].type : undefined);
  const startMode = getModeNumbers(coor[1] ? coor[1].type : undefined);
  return [startKey, startMode];
}

export class ScaleFunctions {
  static circle5(ctx, coor, key, mode) {
    if (coor instanceof Array) {
      const [startKey, startMode] = parseKeyModeCoordinate(coor);
      let [note, newMode] = circleOfFifth(startKey, startMode, key ? parseInt(key.value) : 0, mode ? parseInt(mode.value) : 0);
      note = notes[note % 12] + Math.floor(note / 12);
      newMode = modeNames[newMode];
      return [{type: note}, {type: newMode}];
    }
    if (coor.type && !coor.args) {
      const [startKey, startMode] = parseKeyModeCoordinate(coor);
      let [note, newMode] = circleOfFifth(startKey, 0, key ? parseInt(key.value) : 0, mode ? parseInt(mode.value) : 0);
      note = notes[note % 12] + Math.floor(note / 12);
      return {type: note};
    }
    throw new Error("omg: wrong error to circle of fifths..");
  }

  static scale(coor) {
    const [note, mode] = parseKeyModeCoordinate(coor);
    return modeScales[mode].map(pos => note + pos);
  }

  static chord(coor, notes) {
    const [note, mode] = parseKeyModeCoordinate(coor);
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