const cache = new WeakMap();

export function getEventState(e) {
  let state = cache.get(e);
  if (!state)
    cache.set(e, state = {
      doc: 0,
      phase: 0,
      target: 0,
      listener: -1,
      stopImmediate: [],
      stop: [],
      prevented: [],
    });
  return state;
}

function activePropagationContext(state) {
  return state.phase > 0 && state.phase < 4 && state.contexts[state.doc];
}

Object.defineProperties(Event.prototype, {
//this adds properties to the Event so that we can get the correct state information from it.
  'eventPhase': {    //rule #x: adding phase 4 for event finished propagating.
    get: function () {
      return getEventState(this).phase;
    }
  },
  'currentTarget': {
    get: function () {
      const state = getEventState(this);
      return activePropagationContext(state)?.path[state.target] || null;
    }
  },
  'path': {
    get: function () {
      const state = getEventState(this);
      return activePropagationContext(state)?.path.slice() || [];
    }
  },
  'currentDocument': {
    get: function () {
      const state = getEventState(this);
      return activePropagationContext(state)?.root || null;
    }
  },
  'bouncedPath': {
    value: function () { //returns a copy of the bouncedPath (preserving the original bouncedPath immutable).
      const state = getEventState(this);
      return state.contexts?.map(({parent, root, path}) => ({parent, root, path: path.slice()})) || [];
    }
  },
  //bubbles, composedPath, we don't need to override them. always static
  'stopPropagation': {
    value: function () {
      const state = getEventState(this);
      state.stop[state.doc] = true;
    }
  },
  'stopImmediatePropagation': {
    value: function () {
      const state = getEventState(this);
      state.stopImmediate[state.doc] = true;
    }
  },
  'preventDefault': {
    value: function () {
      const state = getEventState(this);
      state.prevented[state.doc] = true;
    }
  },
  'defaultPrevented': {
    get: function () {
      const state = getEventState(this);
      return !!state.prevented[state.doc];
    }
  }
});