export {EventOG} from './Event.js';
import {getEventState} from './Event.js';

function pathForPhase(path, phase) {
  return phase === 1 ? path.slice(1).reverse() : phase === 2 ? [path[0]] : phase === 3 ? path.slice(1) : [];
}

function nextInLoop(event, contexts, getListeners) {
  event.listener++;
  main: for (; event.doc < contexts.length; event.doc++, event.phase = event.target = event.listener = 0) {
    if (event.stopImmediate[event.doc])
      continue main;
    const context = contexts[event.doc];
    for (; event.phase < 4; event.phase++, event.target = 0) {
      const path = pathForPhase(context.path, event.phase);
      for (; event.target < path.length; event.target++, event.listener = 0) {
        const target = path[event.target];
        const listenerEntries = getListeners(target, event.type, event.phase);
        for (; event.listener < listenerEntries.length; event.listener++) {
          if (!listener.removed)
            return listenerEntries[event.listener];
        }
        if (event.stop[event.doc])
          continue main;
      }
    }
  }
}

const eventStack = [];

export function tick(e, propagationContexts, getListeners, removeListener) {
  const eventState = getEventState(e);
  eventState.contexts = propagationContexts;
  eventStack.unshift(eventState);
  for (let listener; listener = nextInLoop(eventState, propagationContexts, getListeners);) {
    listener.once && removeListener(listener);
    listener.cb.call(listener.target, e);
  }
  if (eventState !== eventStack.shift()) throw 'omg';
  return eventStack.length === 0;
}