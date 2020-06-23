import {} from "./nextTick.js";

//todo, this path needs to be tested individually?? it will be tested indirectly,
// but it might be easier to chase the bugs, if we have separate tests for this one.. maybe
function getComposedPath(target, composed) {
  let slotLevel = 0;
  const path = [];
  const targets = [target];
  while (true) {
    path.push(target);
    const shadowRoot = target.parentNode?.shadowRoot;
    if (shadowRoot) {
      const slotName = target.getAttribute("slot") || "";
      target = shadowRoot.querySelector(!slotName ? "slot:not([name]), slot[name='']" : "slot[name=" + slotName + "]");
      slotLevel++;
      continue;
    }
    if (target.parentNode) {
      target = target.parentNode;
    } else if (target.host) {

      if (!composed && !slotLevel)
        return {propagationPath: path, targets};
      target = target.host;
      if(!slotLevel)
        targets.push(target);
      else
        slotLevel--;
    } else if (target.defaultView) {
      target = target.defaultView;
    } else {
      break;
    }
  }
  return {propagationPath: path, targets};
}

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

function populateEvent(event, target, propagationPath) {
  Object.defineProperties(event, {
    target: {
      get: function () {
        let lowest = target;
        for (let t of propagationPath) {
          if (t === this.currentTarget)
            return lowest;
          if (t instanceof DocumentFragment && t.mode === "closed")
            lowest = t.host || lowest;
        }
      }
    },
    composedPath: function () { //todo this assumes that there are no mode: closed, but it should still work if there are does.
      return propagationPath.slice();
    },
    //todo coordinate this with the unstoppable option. They should work the same way.
    stopImmediatePropagation: {
      value: function () {
        this._propagationStoppedImmediately = true;
      }
    }
  });
}

async function callOrQueueListenersForTargetPhase(currentTarget, event, phase, options, macrotask, listenerPhase) {
  const listeners = getEventListeners(currentTarget, event.type, listenerPhase)
    .filter(listener => listener.unstoppable || !isStopped(event, event.isScoped || listener.scoped));
  if (!listeners || !listeners.length)
    return;
  Object.defineProperties(event, {
    "currentTarget": {value: currentTarget, writable: true},
    "eventPhase": {value: phase, writable: true}
  });
  if (!options?.async) {                                             //sync
    for (let listener of listeners)
      callListenerHandleError(currentTarget, listener, event);
    return;
  }
  const cbs = listeners.map(function (listener) {                 //async
    return callListenerHandleError.bind(null, listeners, listener, event);
  });
  return await macrotask.nextMesoTick(cbs);
}

async function dispatchEvent(event, options) {
  if (isStopped(event)) //stopped before dispatch.. yes, it is possible to do var e = new Event("abc"); e.stopPropagation(); element.dispatchEvent(e);
    return;
  const {propagationPath, targets} = getComposedPath(this, event.composed);
  populateEvent(event, this, propagationPath);

  let mesotaskDepth = event.bubbles ? (propagationPath.length * 2) + 1 : propagationPath.length + 1;
  //todo should +1 when we bounce so we have space to run the default action.
  let macrotask = nextMesoTicks([function () {
  }], mesotaskDepth + 1);//todo hack.. problem initiating without knowing the tasks

  for (let i = propagationPath.length - 1; i > 0; i--) {  //note, this doesn't do i>=0. The capture phase excludes the running of the lowest target.
    const currentTarget = propagationPath[i];
    const phase = targets.indexOf(currentTarget) !== -1 ? Event.AT_TARGET : Event.CAPTURING_PHASE;
    await callOrQueueListenersForTargetPhase(currentTarget, event, phase, options, macrotask, Event.CAPTURING_PHASE );
  }

  await callOrQueueListenersForTargetPhase(propagationPath[0], event, Event.AT_TARGET, options, macrotask, Event.AT_TARGET);

  for (let i = 1; i < propagationPath.length; i++) {
    let currentTarget = propagationPath[i];
    const phase = targets.indexOf(currentTarget) !== -1 ? Event.AT_TARGET : Event.BUBBLING_PHASE;
    if (event.bubbles || phase !== Event.BUBBLING_PHASE)
      await callOrQueueListenersForTargetPhase(currentTarget, event, phase, options, macrotask, Event.BUBBLING_PHASE);
  }
}

export function addDispatchEventOptionAsync(EventTargetPrototype, sync){
  const dispatchOG = EventTargetPrototype.dispatchEvent;

  function dispatchEventAsyncOnly(event, options){
    options?.async?
      dispatchEvent.call(this, event, options): //async
      dispatchOG.call(this, event);             //sync
  }

  const dispatchMethod = sync ? dispatchEvent : dispatchEventAsyncOnly;
  Object.defineProperty(EventTargetPrototype, "dispatchEvent", {value: dispatchMethod});
}