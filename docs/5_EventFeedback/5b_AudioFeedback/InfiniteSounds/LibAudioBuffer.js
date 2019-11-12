/**
 * AudioFileRegister caches the arrayBuffers for different audio url's.
 * This implementation is naive because it:
 * 1. doesn't handle url files that change dynamically
 * 2. stores potentially infinite audio url files directly in memory
 *
 * Can be made smarter by:
 * 1. keeping a limit on how many files are stored.
 *    If more than 100 audiofiles, or 20mb data
 *    (ie. the sum of the length/size of each arrayBuffer in the cache),
 *    then delete the cached arrayBuffer last retrieved from the cache.
 * 2. Add a static method AudioFileRegister.clearCache(url) that can be called manually from js.
 * 3. Preferably use the ttl of the http request to control the cache. If the ttl of the http request is not ok, then:
 *    a. When the file is first added to the cache register,
 *       check if trying to get the same file again returns a 304, not modified.
 *    b. if the file was not modified last time, then use the cache and check *after* the cache has been delivered
 *       if the assumption that the server returns a 304.
 *    c. check rarely if the cache needs updating, ie. after every 10n uses of the cache, ie. 1, 10, 100, 1000 etc.
 *
 * A combination of 1 and 3 should be ok.
 */
const cachedFiles = Object.create(null);

class AudioBufferRegister {

  static async fetchAudioBufferUrl(url, ctx) {
    if (url.startsWith("noise:")) {
      const [dur, sample] = url.substr(6).split(":").map(n => parseInt(n));
      return AudioBufferRegister.makeNoiseNode(dur, sample);
    }
    if (url.endsWith("json"))
      return await ctx.decodeAudioData(new Uint8Array(await (await fetch(url)).json()).buffer);
    return await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  }

  static async getAudioBuffer(url, ctx) {
    return cachedFiles[url] ?
      cachedFiles[url] :
      cachedFiles[url] = AudioBufferRegister.fetchAudioBufferUrl(url, ctx);
  }

  static makeNoiseNode(duration, sampleRate) {
    const ctx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    const bufferSize = sampleRate * duration; // set the time of the note
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate); // create an empty buffer
    let data = buffer.getChannelData(0); // get data
    // fill the buffer with noise
    for (let i = 0; i < bufferSize; i++)
      data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}

export const AudioBufferFunctions = Object.create(null);

AudioBufferFunctions["#"] = async (node, ctx) => await AudioBufferRegister.getAudioBuffer(node.body[1], ctx[ctx.length - 1].webAudio);
// node.body[0] = await (
//   typeof data === "string" ? await AudioBufferRegister.getAudioBuffer(data, ctx) :
//     data instanceof Array ? new Uint8Array(data).buffer :
//       // array.type === "base64" ? convertToAudioBuffer(array) :
//       undefined);
//
// if (!node.body[0])                           //todo this will be fixed if the AudioBuffer is its own data type
//   throw new Error("Cannot create convolver without a valid description.");

