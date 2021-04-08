import {findNativeDefaultAction} from "./FindNativeDefaultAction.js";

export const EventOG = Object.freeze({
  composedPath: Event.prototype.composedPath,
  stopPropagation: Event.prototype.stopPropagation,
  stopImmediatePropagation: Event.prototype.stopImmediatePropagation,
  preventDefault: Event.prototype.preventDefault
});

//WhatIs: stopPropagation and preventDefault *before* event dispatch?
//a. To call .preventDefault() *before* dispatch essentially strips any default action from the event before it beings. Valid.
//b. To call .stopPropagation() *before* dispatch means that the event will only propagate one context, one phase, one target.
//c. To call .stopImmediatePropagation() *before* dispatch means that the event will not propagate, if some other part of the system tries to dispatch it.
//   todo problems here.

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
      preventedHosts: [],
    });
  return state;
}

function activePropagationContext(state) {
  return state.phase > 0 && state.phase < 4 && state.contexts[state.doc];
}

// rule #4: 'stopPropagation' and 'stopImmediatePropagation' works only per propagationContext/document.
// rule #5: eventPhase === 0 Event.NONE means not yet begun, eventPhase === 4 Event.FINISHED === 4

Object.defineProperty(Event, "FINISHED", {value: 4, writable: false, configurable: false, enumerable: true});

function getParentIndex(contexts, i) {
  return contexts.findIndex(({root}) => root === contexts[i].parent);
}

function propagationContextPrevented(contexts, prevented, i) {
  for (; i >= 0; i = getParentIndex(contexts, contexts[i]))
    if (prevented[i]) return true;
  return false;
}

export function checkNativePreventDefault(event) {
  const target = findNativeDefaultAction(event, EventOG.composedPath.call(event));
  if (!target)
    return false;
  const state = getEventState(event);
  if (state.preventedHosts.includes(target))
    return EventOG.preventDefault.call(event);
  const hostIndex = state.contexts?.findIndex(({path}) => path.includes(target));
  if (propagationContextPrevented(state.contexts, state.prevented, hostIndex))
    EventOG.preventDefault.call(event);
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
  //bubbles, composed: NO need to override, always static
  'composedPath': {
    value: function () {
      const fullPath = EventOG.call(this);                       //todo
      const last = this.contexts[0].root;                        //todo
      const index = fullPath.indexOf(last);
      return index >= 0 ? fullPath.slice(0, index) : fullPath;
    }
  },
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
      return propagationContextPrevented(state.contexts, state.prevented, state.doc);
    }
  },
  'preventDefaultOnHost': {
    value: function (element) {
      if (!(element instanceof Element))
        throw new Error('IllegalArgument: preventDefaultInside(element) can only be called on Element objects.');
      if (!this.composedPath().includes(element))
        throw new Error('IllegalArgument: The given element is not EventTarget of the current event.');
      const state = getEventState(this);
      const shadowRoot = element.shadowRoot;
      const indexOfShadowRoot = state.contexts?.findIndex(({root}) => root === shadowRoot);
      indexOfShadowRoot >= 0 ?
        state.prevented[indexOfShadowRoot] = true :
        state.preventedHosts.push(element);
    }
  }
});