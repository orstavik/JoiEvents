import {} from "./nextTick.js";
import {computePropagationPath, scopedPaths} from "./computePaths.js";
import {addEventTargetRegistry} from "./getEventListeners_once_last_first.js";
import {addEventListenerOptionScopedUnstoppable, isStopped, addEventIsStoppedScoped} from "./ScopedEventListeners.js";

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

function initializeEvent(event, target) {
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
      //todo there are some minor performance upgrades that can be made around stopImmediatePropgation()..
      // but they are more complex than the naive implementation below suggests, as they need to take into account
      // the scoped and non-scoped nature of the calls.
    // },
    // stopImmediatePropagation: {
    //   value: function () {
    //     immediatelyStopped.add(this);
    //   }
    }
  });
}
const immediatelyStopped = new WeakSet();


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
  const fullPath = computePropagationPath(this, event.composed, event.bubbles);
  initializeEvent(event, this);

  let macrotask = nextMesoTicks([function () {
  }], fullPath.length + 1);//todo hack.. problem initiating without knowing the tasks
  //todo should +2 for bounce: true so we have a mesotask for the default action(s) too.

  for (let {target: currentTarget, phase, listenerPhase} of fullPath) {
    let listeners = getEventListeners(currentTarget, event.type, listenerPhase);
    //todo this filter works fine for stopPropagation on the node level, but it doesn't handle the stopImmediatePropagation.
    if (!listeners.length)
      continue;
    updateEvent(event, currentTarget, phase);
    listeners = listeners.filter(listener => listener.unstoppable || !isStopped(event, listener.scoped)); //isStopped require the currentTarget and phase
    if (!listeners.length)
      continue;
    if (options?.async) {
      await callOrQueueListenersForTargetPhase(currentTarget, event, listeners, options, macrotask);
    } else {
      for (let listener of listeners)
        //todo here i would need to check if stopImmediatePropagation was called.
        callListenerHandleError(currentTarget, listener, event);
    }
    //removing once manually, like we handle the unstoppable and isStopped manually
    for (let listener of listeners)
      listener.once && currentTarget.removeEventListener(listener.type, listener.listener, listener.capture);
  }
}

export function addDispatchEventOptionAsync(EventTargetPrototype, sync) {
  //todo here we need to add the prototypes to the scoped stopPropagatoin and eventListener registry
  addEventIsStoppedScoped(Event.prototype);
  addEventListenerOptionScopedUnstoppable(EventTarget.prototype);
  const getEventListeners = addEventTargetRegistry(EventTarget.prototype);

  const dispatchOG = EventTargetPrototype.dispatchEvent;

  function dispatchEventAsyncOnly(event, options) {
    options?.async ?
      dispatchEvent.call(this, event, options) : //async
      dispatchOG.call(this, event);             //sync
  }

  const dispatchMethod = sync ? dispatchEvent : dispatchEventAsyncOnly;
  Object.defineProperty(EventTargetPrototype, "dispatchEvent", {value: dispatchMethod});
  return getEventListeners;
}