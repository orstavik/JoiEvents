import {MusicModes} from "./MusicModes";

const andAOnes = new WeakMap();

async function getAndAOne(ctx) {
  const cached = andAOnes.get(ctx);
  if (cached)
    return cached;
  const andANewOne = await ctx.createConstantSource();
  andAOnes.set(ctx, andANewOne);
  return andANewOne;
}

export class AbsNoteNode {

  constructor(tone, octave, mode){
    this.tone = tone.toLowerCase();
    this.octave = octave;
    this.mode = mode;
  }




  async init(ctx){
    const andAOne = await getAndAOne(ctx);
    this._gain = await ctx.createGain();
    andAOne.connect(this._gain);
  }

  connect(node){
    this._gain.connect(node);
  }
}