export {tick} from "./EventLoop.js";

Object.defineProperties(Event.prototype, {
  'currentTarget': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? null : frame.contexts[frame.doc].path[frame.target];
    }
  },
  'eventPhase': {
    get: function () {
      const frame = this.__frame;
      return frame ? frame.phase : 0;
    }
  },
  'path': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? [] : frame.contexts[frame.doc].path.slice();
    }
  },
  'currentDocument': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? null : frame.contexts[frame.doc].root;
    }
  },
  'bouncedPath': {
    get: function () { //returns a copy of the bouncedPath (preserving the original bouncedPath immutable).
      const frame = this.__frame;
      return frame.contexts.map(({root, path}) => ({root, path: path.slice()}));
    }
  }
});