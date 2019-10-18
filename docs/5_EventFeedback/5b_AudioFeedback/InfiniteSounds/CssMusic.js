import {interpret} from "./Interpreter3.js";

export class CssMusic extends AudioContext {

  static async load(sound) {
    //turn the result into an Offline AudioBuffer that we can reuse..
    /**
     * todo 0. Reuse the processing. To do that we need to analyze it into an ArrayBuffer. That can be reused.
     * todo    But, to convert it into an ArrayBuffer, we need to know when the sound is off.. To know that, we either
     * todo    need to have a "off(endtime)", or analyze a "gain()" expression, in the main pipe, verify that no source
     * todo    nodes are added after it, and check if it ends with 0 (which only can be done in an envelope or a fixed
     * todo    value), and then calculate the duration of the gain with sound. then summarize the duration of that gain.
     * todo
     * todo max. can we use offlineAudioCtx to make an ArrayBuffer of a sound, to make it faster to play back?
     */
    const ctx = new CssMusic();
    const result = await interpret(sound, ctx);

    if (result.output instanceof Array) {
      for (let audioNode of result.output ) {
        audioNode.connect(ctx.specialGain);
      }
    } else
      result.output.connect(ctx.specialGain);
    return ctx;
  }

  constructor() {
    super();
    this.specialGain = this.createGain();
    this.specialGain.gain.value = 1;
    this.specialGain.connect(this.destination);
    this.suspend();
  }

  stop() {
    console.log("boo");
    if (location.hash === "linear") {
      this.specialGain.gain.linearRampToValueAtTime(0.0001, this.currentTime + 0.03);
    } else if (location.hash === "exponential") {
      this.specialGain.gain.exponentialRampToValueAtTime(0.0001, this.currentTime + 0.03);
    } else if (location.hash === "absolute") {
      this.specialGain.gain.value = 0;
    } else {
      this.specialGain.gain.setTargetAtTime(0, this.currentTime, 0.015);
    }
    setTimeout(() =>
      super.suspend(), 100);
  }

  //http://alemangui.github.io/blog//2015/12/26/ramp-to-value.html
  /**
   * This method tries to avoid a change in the sound when one audio context replaces another.
   * todo there is still a crackle in the sound.. It is not very big, but it is there.
   * todo it might be considered a feature that the sound gets a slight bump when one sound replace another,
   * todo as this is likely to represent some kind of change in the app state, relevant for the user to be
   * todo notified of.
   * @param ctx
   */
  replace(ctx) {
    ctx.stop();
    if (location.hash === "linear") {
      this.specialGain.gain.linearRampToValueAtTime(1, this.currentTime + 0.03);
    } else if (location.hash === "exponential") {
      this.specialGain.gain.exponentialRampToValueAtTime(1, this.currentTime + 0.03);
    } else if (location.hash === "absolute") {
      this.specialGain.gain.value = 1;
    } else {
      this.specialGain.gain.setTargetAtTime(1, this.currentTime, 0.015);
    }
    this.resume();
  }
}