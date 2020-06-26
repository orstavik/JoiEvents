import {} from "./nextTick.js";

/*
 * ScopedPaths are a set of nested arrays which contain the eventTarget divided by DOM contexts.
 * If you flatten the ScopedPaths, ie. scopedPaths(el, trueOrFalse).flat(Infinity),
 * then you will get the same output as the composedPath() for that element
 * if a composed: trueOrFalse event were dispatched to it.
 *
 * @returns [[path], [path]]
 *          where each path can consist of elements, or other slotted paths.
 */
export function scopedPaths(target, composed, originShadow) {
  let path = originShadow ? [originShadow] : [];
  while (target) {
    path.push(target);
    target.assignedSlot && path.push(scopedPaths(target.assignedSlot, false));
    target = target.parentNode;
  }
  const last = path[path.length - 1];
  if (composed && last.host)
    return scopedPaths(last.host, composed, path);
  if (last === document)
    path.push(window);
  return path;
}

export function filterComposedTargets(scopedPath) {
  return scopedPath[0] instanceof Array ?
    [...filterComposedTargets(scopedPath[0]), scopedPath[1]] :
    [scopedPath[0]];
}

function calculatePropagationPaths(scopedPath, bubbles) {
  //process AT_TARGET nodes, both the normal, innermost AT_TARGET, and any composed, upper, host node AT_TARGETs.
  const composedTargets = filterComposedTargets(scopedPath);//todo this is updated and not tested..
  const lowestTarget = composedTargets.shift();      //the lowestMost target is processed separately

  const raw = scopedPath.flat(Infinity);
  raw.shift();                                       //the lowestMost target is processed separately

  //BUBBLE nodes (or upper, composed AT_TARGET nodes if the event doesn't bubble)
  const bubble = bubbles ?
    raw.map(target => ({target: target, phase: composedTargets.indexOf(target) >= 0 ? 32 : 3})) :
    composedTargets.map(target => ({target: target, phase: 32}));

  //CAPTURE nodes
  const capture = raw.reverse().map(target => ({
    target: target,
    phase: composedTargets.indexOf(target) >= 0 ? 12 : 1
  }));

  return capture.concat([{target: lowestTarget, phase: 2}]).concat(bubble);
}

//todo what about the situation when you dispatch an event on a lightDOM child, and then
//else return path; //todo this is an edge case that could tip in different directions. The browser will run the lightDOM path. It is a question if that is the right thing to do...

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

async function callOrQueueListenersForTargetPhase(currentTarget, event, phase, options, macrotask) {
  const listenerPhase = phase === 32 ? 3 : phase === 12 ? 1 : phase;
  const listeners = getEventListeners(currentTarget, event.type, listenerPhase)
    .filter(listener => listener.unstoppable || !isStopped(event, event.isScoped || listener.scoped));
  if (!listeners.length)
    return;
  if (phase === 32 || phase === 12) phase = 2;
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
  const scopedPath = scopedPaths(this, event.composed);
  const fullPath = calculatePropagationPaths(scopedPath, event.bubbles);
  populateEvent(event, this, scopedPath);

  let macrotask = nextMesoTicks([function () {
  }], fullPath.length + 1);//todo hack.. problem initiating without knowing the tasks
  //todo should +2 for bounce: true so we have a mesotask for the default action(s) too.

  for (let {target, phase} of fullPath)
    await callOrQueueListenersForTargetPhase(target, event, phase, options, macrotask);
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