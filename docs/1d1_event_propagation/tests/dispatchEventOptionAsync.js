import {} from "./nextTick.js";
import {computePropagationPath, scopedPaths} from "./computePaths.js";

function callListenerHandleError(target, listener, event) {
  if (listener.removed)
    return;
  try {
    const cb = listener.listener;
    cb instanceof Function ? cb.call(target, event) : cb.handleEvent(event);
  } catch (error) {
    const message = 'Uncaught Error: event listener break down';
    const uncaught = new ErrorEvent('error', {error, message});
    window.dispatchEvent(uncaught);//always sync!
    !uncaught.defaultPrevented && console.error(uncaught);
  }
}

function populateEvent(event, target, scopedPath) {
  Object.defineProperties(event, {
    target: {
      get: function () {
        let lowest = target;
        for (let t of this.composedPath()) {
          if (t === this.currentTarget)
            return lowest;
          if (t instanceof DocumentFragment && t.mode === "closed")
            lowest = t.host || lowest;
        }
      }
    },
    composedPath: function () {
      return scopedPath.flat(Infinity);   //we can cache this if we want
    },
    //todo coordinate this with the unstoppable option. They should work the same way.
    stopImmediatePropagation: {
      value: function () {
        this._propagationStoppedImmediately = true;
      }
    }
  });
}

async function callOrQueueListenersForTargetPhase(currentTarget, event, listeners, options, macrotask) {
  const cbs = listeners.map(function (listener) {                 //async
    return callListenerHandleError.bind(null, currentTarget, listener, event);
  });
  return await macrotask.nextMesoTick(cbs);
}

let updateEvent = function (event, target, phase) {
  Object.defineProperties(event, {
    "currentTarget": {value: target, writable: true},
    "eventPhase": {value: phase, writable: true}
  });
};

async function dispatchEvent(event, options) {
  if (isStopped(event)) //stopped before dispatch.. yes, it is possible to do var e = new Event("abc"); e.stopPropagation(); element.dispatchEvent(e);
    return;
  const scopedPath = scopedPaths(this, event.composed);
  const fullPath = computePropagationPath(scopedPath, event.bubbles);
  populateEvent(event, this, scopedPath);

  let macrotask = nextMesoTicks([function () {
  }], fullPath.length + 1);//todo hack.. problem initiating without knowing the tasks
  //todo should +2 for bounce: true so we have a mesotask for the default action(s) too.

  for (let {target: currentTarget, phase, listenerPhase} of fullPath) {
    const listeners = getEventListeners(currentTarget, event.type, listenerPhase)
      .filter(listener => listener.unstoppable || !isStopped(event, event.isScoped || listener.scoped));
    if (!listeners.length)
      continue;
    updateEvent(event, currentTarget, phase);
    if (options?.async) {
      await callOrQueueListenersForTargetPhase(currentTarget, event, listeners, options, macrotask);
    } else {
      listeners.forEach(listener => callListenerHandleError(currentTarget, listener, event));
    }
  }
}

export function addDispatchEventOptionAsync(EventTargetPrototype, sync) {
  const dispatchOG = EventTargetPrototype.dispatchEvent;

  function dispatchEventAsyncOnly(event, options) {
    options?.async ?
      dispatchEvent.call(this, event, options) : //async
      dispatchOG.call(this, event);             //sync
  }

  const dispatchMethod = sync ? dispatchEvent : dispatchEventAsyncOnly;
  Object.defineProperty(EventTargetPrototype, "dispatchEvent", {value: dispatchMethod});
}