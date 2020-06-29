import {} from "./nextTick.js";
import {computePropagationPath, scopedPaths} from "./computePaths.js";

let isStopped, getEventListeners;

function callListenerHandleError(target, listener, event) {
  if (listener.removed)
    return;
  if (!listener.unstoppable && isStopped(event, listener.scoped))
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

function initializeEvent(event, target, scoped) {
  //we need to freeze the composedPath at the point of first dispatch
  const composedPath = scopedPaths(target, event.composed).flat(Infinity);
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
    composedPath: {
      value: function () {
        return composedPath;   //we can cache this if we want
      },
      writable: false
    }
  });
  scoped && Object.defineProperty(event, "isScoped", {value: true});
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

/**
 *
 * @param event
 * @param options {async: true, cutOff: shadowRoot/document, scoped: true/false}
 * @returns {Promise<void>}
 */
async function dispatchEvent(event, options) {
  if (isStopped(event)) //stopped before dispatch.. yes, it is possible to do var e = new Event("abc"); e.stopPropagation(); element.dispatchEvent(e);
    return;

  const fullPath = computePropagationPath(this, event.composed, event.bubbles, options?.cutOff);
  initializeEvent(event, this, !!options?.scoped);

  let macrotask = nextMesoTicks([function () {
  }], fullPath.length + 1);//todo hack.. problem initiating without knowing the tasks
  //todo should +2 for bounce: true so we have a mesotask for the default action(s) too.

  for (let {target, phase, listenerPhase} of fullPath) {
    let listeners = getEventListeners(target, event.type, listenerPhase);
    if (!listeners.length)
      continue;
    updateEvent(event, target, phase);//todo why did i do this here again?
    //the filter below works for regular stopPropagation() calls, but not stopImmediatePropagation() calls.
    listeners = listeners.filter(listener => listener.unstoppable || !isStopped(event, listener.scoped));
    if (!listeners.length)
      continue;
    if (options?.async) {
      await callOrQueueListenersForTargetPhase(target, event, listeners, options, macrotask);
    } else {
      for (let listener of listeners)
        //todo here i would need to check if stopImmediatePropagation was called.
        callListenerHandleError(target, listener, event);
    }
    //removing once manually, like we handle the unstoppable and isStopped manually
    for (let listener of listeners)
      listener.once && target.removeEventListener(listener.type, listener.listener, listener.capture);
  }
}

export function addDispatchEventOptionAsync(EventTargetPrototype, sync, isStoppedImpl, getEventListenersImpl) {
  isStopped = isStoppedImpl;                    //todo || window.isStopped;
  getEventListeners = getEventListenersImpl;    //todo || window.isStopped;

  const dispatchOG = EventTargetPrototype.dispatchEvent;
  function dispatchEventAsyncOnly(event, options) {
    options?.async ?
      dispatchEvent.call(this, event, options) : //async
      dispatchOG.call(this, event);             //sync
  }

  const dispatchMethod = sync ? dispatchEvent : dispatchEventAsyncOnly;
  Object.defineProperty(EventTargetPrototype, "dispatchEvent", {value: dispatchMethod});
}