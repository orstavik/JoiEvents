export {EventLoop} from "./EventLoopStopProp.js";

//this adds properties to the Event so that we can get the correct state information from it.
//rule #x: adding phase 4 for event finished propagating.

function active(frame) {
  return frame && frame.phase > 0 && frame.phase < 4;
}

Object.defineProperties(Event.prototype, {
  'eventPhase': {
    get: function () {
      const frame = this.__frame;
      return frame ? frame.phase : 0;
    }
  },
  'currentTarget': {
    get: function () {
      const frame = this.__frame;
      return active(this) ? frame.contexts[frame.doc].path[frame.target] : null;
    }
  },
  'path': {
    get: function () {
      const frame = this.__frame;
      return active(this) ? frame.contexts[frame.doc].path.slice() : [];
    }
  },
  'currentDocument': {
    get: function () {
      const frame = this.__frame;
      return active(this) ? frame.contexts[frame.doc].root : null;
    }
  },
  'bouncedPath': {
    get: function () { //returns a copy of the bouncedPath (preserving the original bouncedPath immutable).
      const frame = this.__frame;
      return active(this) ? frame.contexts.map(({root, path}) => ({root, path: path.slice()})) : [];
    }
  },
  //bubbles, composedPath, we don't need to override them. always static
  'stopPropagation': {
    value: function () {
      const frame = this.__frame || new EventLoop(this);    //this we need to pre-initialize to make work
      frame && (frame.stop[frame.doc] = true);
    }
  },
  'stopImmediatePropagation': {
    value: function () {
      const frame = this.__frame || new EventLoop(this);
      frame && (frame.stopImmediate[frame.doc] = true);
    }
  },
  'preventDefault': {
    value: function () {
      const frame = this.__frame || new EventLoop(this);
      frame && (frame.prevented[frame.doc] = true);
    }
  },
  'defaultPrevented': {
    value: function () {
      const frame = this.__frame;
      return frame && frame.prevented[frame.doc];
    }
  }
});