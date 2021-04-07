//this adds properties to the Event so that we can get the correct state information from it.
export {tick} from "./EventLoop.js";

Object.defineProperties(Event.prototype, {
  'currentTarget': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? null : frame.bouncedPath[frame.doc].path[frame.target];
    }
  },
  'eventPhase': {     //adding phase 4 for event finished propagating.
    get: function () {
      const frame = this.__frame;
      return frame ? frame.phase : 0;
    }
  },
  'path': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? [] : frame.bouncedPath[frame.doc].path.slice();
    }
  },
  'currentDocument': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? null : frame.bouncedPath[frame.doc].root;
    }
  },
  'bouncedPath': {
    get: function () { //returns a copy of the bouncedPath (preserving the original bouncedPath immutable).
      const frame = this.__frame;
      return frame.bouncedPath.map(({root, path}) => ({root, path: path.slice()}));
    }
  }
});