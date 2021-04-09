export {EventOG, checkAndPreventNativeDefaultAction} from './Event.js';
import {setPaths} from './Event.js';

function pathForPhase(path, phase) {
  return phase === 1 ? path.slice(1).reverse() : phase === 2 ? [path[0]] : phase === 3 ? path.slice(1) : [];
}

function nextInLoop(type, event, contexts, getListeners) {
  nextContext: for (; event.doc < contexts.length; event.doc++, event.phase = 1, event.target = event.listener = 0) {
    if (event.stopImmediate[event.doc])
      continue nextContext;
    const context = contexts[event.doc];
    for (; event.phase < 4; event.phase++, event.target = 0) {
      const path = pathForPhase(context.path, event.phase);
      for (; event.target < path.length; event.target++, event.listener = 0) {
        const target = path[event.target];
        const listeners = getListeners(target, type, event.phase);
        while (event.listener < listeners.length) {
          const listener = listeners[event.listener++];
          if (!listener.removed)
            return listener;
        }
        if (event.stop[event.doc])
          continue nextContext;
      }
    }
  }
  event.phase = 4, event.doc = 0;
}

const eventStack = [];

export function propagate(e, target, root, getListeners, removeListener) {
  const eventState = setPaths(e, target, root);
  eventStack.unshift(eventState);
  for (let listener; listener = nextInLoop(e.type, eventState, eventState.contexts, getListeners);) {
    listener.once && removeListener(listener);
    listener.cb.call(listener.target, e);
  }
  if (eventState !== eventStack.shift()) throw 'omg';
  return eventStack.length === 0;
}