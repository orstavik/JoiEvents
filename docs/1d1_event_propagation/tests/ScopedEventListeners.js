//todo use the beforeStops to implement a cancel function for the blocking of events.
/**
 * returns null before/after the event's propagation being/ends
 *         window if the event is currently propagating in the main DOM
 *         ShadowRoot of the web component in which the current propagation target exists in
 *
 * Note that the context is not the same as the propagation origin node for composed: false events.
 * The currentEventContext will give another result when the event propagates into a slotted context.
 *
 * @param event
 * @returns {null|window|ShadowRoot}
 */
export function currentEventContext(event) {//todo rename to getPropagationRootNode(event)?? //todo move to computePaths.js??
  if (!event.currentTarget)
    return null;
  const root = event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
  return root === document ? window : root;
}

//whenStopPropWasCalled:
//  .stopPropagation() => {currentTarget, eventPhase}
//  .stopImmediatePropagation() => true

//event => whenStopPropWasCalled
const globalStops = new WeakMap();
//event => root => whenStopPropWasCalled
const localStops = new WeakMap();
//[event, event, ...]
const beforeStops = new WeakSet();

function stopListener(e, stop) {
  return stop === true || (stop && (stop.currentTarget !== e.currentTarget || stop.eventPhase !== e.eventPhase));
}

/**
 * Implied parameter is event.isScoped. This property can be set on each event before dispatch, or
 * it can be set to true on the Event.prototype to force all events to be isScoped by default.
 *
 * @param event whose propagation is to be checked if it has been stopped.
 * @param listenerIsScoped if true, then only check if the propagation has been stopped in the current DOM context.
 * @returns {boolean} true if somebody has called stopPropagation on it before the event has begun propagaton,
 *                    true if the event is stopped in this current DOM context, and if a previous event listener
 *                         on the same target node has called stopImmediatePropagation, and
 *                    true if scoped is false, and the normal/old .stopPropagation() has been called on the event
 *                         in a different DOM propagation context, ie. inside another web component or
 *                         in the main dom outside a web component that the event currently propagates in.
 */
function isStopped(event, listenerIsScoped) {
  if (beforeStops.has(event))
    return true;
  if (!listenerIsScoped && !event.isScoped && stopListener(event, globalStops.get(event)))  //check if it is non-scoped first, as that is cheapest
    return true;
  const scope = currentEventContext(event);                    //check if stopped in current context. Applies to all.
  return !!stopListener(event, localStops.get(event)?.get(scope));
}

/**
 * Adds a boolean option "scoped" to stopPropagation(), stopImmediatePropagation().
 * When .stopPropagation(true) or .stopImmediatePropagation(true)is called, then
 * the propagation should only be blocked for event listeners in the same DOM context
 * that the event currently propagates.
 *
 * addEventIsStoppedScoped can be applied to:
 *  1. the EventPrototype,
 *  2. the prototype of a specific event type(class), or
 *  3. a specific event object.
 *
 * cancelBubble mostly echoes the native `stopPropagation()`.
 * event.cancelBubble = false    ===     event.stopPropagation(false)
 * let a = event.cancelBubble    ===     let b = event.isStopped(false)
 *
 * However, there are a few things to note:
 *  1. cancelBubble yields the same output if stopPropagation() or stopImmediatePropagation() is called.
 *     This means that it does not accurately reflect the state of propagation.
 *     If you inside an event listener are unsure if stopPropagtion() or stopImmediatePropagtion() has been called on
 *     this event already, for example as a side effect of a complex framework function you have called,
 *     then cancelBubbles gives you no valid output as it will return <true> in either case.
 *  2. stopPropagation(true) and stopImmediatePropagation(true) are excluded from the output of cancelBubble getter.
 *     This is intentional. Event listeners might be still be called on the
 *
 *  Summary. cancelBubble is a bad pattern. With complex event propagation, you should only check the state of
 *  propagation in your current DOM context.
 *  When more advanced event listeners are added that are either {scoped: true} or {unstoppable: true}, that safely
 *  allow web components to generate custom default actions, then a global propagation state simply cease to exists.
 *
 * @param EventPrototype
 */
export function addEventIsStoppedScoped(EventPrototype) {
  Object.defineProperty(EventPrototype, "stopPropagation", {
    value: function stopPropagation(scoped) {
      if (this.eventPhase === 0)
        return beforeStops.add(this);
      const value = {currentTarget: this.currentTarget, eventPhase: this.eventPhase};
      if (!scoped)
        !globalStops.has(this) && globalStops.set(this, value);
      const context = currentEventContext(this);
      let scopeMap = localStops.get(this);
      if (!scopeMap)
        return localStops.set(this, new WeakMap([[context, value]]));
      return !scopeMap.has(context) && scopeMap.set(context, value);
    }
  });
  Object.defineProperty(EventPrototype, "stopImmediatePropagation", {
    value: function stopImmediatePropagation(scoped) {
      if (this.eventPhase === 0)
        return beforeStops.add(this);
      if (!scoped)
        globalStops.set(this, true);
      const context = currentEventContext(this);
      let scopeMap = localStops.get(this);
      if (!scopeMap)
        localStops.set(this, scopeMap = new WeakMap());
      return scopeMap.set(context, true);
    }
  });
  Object.defineProperty(EventPrototype, "cancelBubble", {
    get: function () {
      return globalStops.has(this);
    }, set: function (value) {
      return value && this.stopPropagation();
    }
  });

  return isStopped;
}

//"scope" and "unstoppable" options for event listener

//target* => cb* => type+" "+capture => cbOnce
const targetCbWrappers = new WeakMap();

function makeKey(type, options) {
  return (options instanceof Object ? options.capture : options) ? type + " capture" : type;
}

function hasWrapper(target, type, cb, options) {
  const dict = targetCbWrappers.get(target)?.get(cb);
  return dict && makeKey(type, options) in dict;
}

function setWrapper(target, type, cb, options, wrapped) {
  let cbMap = targetCbWrappers.get(target);
  if (!cbMap)
    targetCbWrappers.set(target, cbMap = new WeakMap());
  let typeDict = cbMap.get(cb);
  if (!typeDict)
    cbMap.set(cb, typeDict = {});
  typeDict[makeKey(type, options)] = wrapped;
}

function removeWrapper(target, type, options, cb) {
  const typeDict = targetCbWrappers.get(target)?.get(cb);
  if (!typeDict)
    return null;
  const key = makeKey(type, options);
  const result = typeDict[key];
  delete typeDict[key];
  return result;
}

//scoped event listeners will only obey stopPropagations called inside the same scope.
//unstoppable event listeners will not obey any stopPropagations.
export function addEventListenerOptionScopedUnstoppable(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerUnstoppable(type, cb, options) {
    if (hasWrapper(this, type, cb, options))
      return;
    let wrapped;
    if (options instanceof Object && options.unstoppable) {
      wrapped = cb;
    } else if (options instanceof Object && options.scoped) {
      wrapped = function (e) {
        !isStopped(e, true) && cb.call(this, e);//when we control dispatch, these two checks can be done before we add
                                                       // the event listener to the task queue
      };                                               //when we are reacting to the native dispatch, we have to run the listeners.
    } else {
      wrapped = function (e) {                         //we check the listener options, and then we check the e.isScoped and isStopped(event, scoped)
        !isStopped(e, e.isScoped) && cb.call(this, e); //scoped = e.isScoped || listener.scoped === true
      };                                               //isStopped = !listener.unstoppable && isStopped(event, scoped)
    }                                                  //if (!isStopped), then add the listener to the queue
    setWrapper(this, type, cb, options, wrapped)
    addEventListenerOG.call(this, type, wrapped, options);
  }

  function removeEventListenerUnstoppable(type, cb, options) {
    //tries to remove both the stoppable and the unstoppable wrapper. Don't know which one was added here.
    const args = removeWrapper(this, type, options, cb) || cb;
    removeEventListenerOG.call(this, type, args, options);
  }

  Object.defineProperties(EventTargetPrototype, {
    addEventListener: {value: addEventListenerUnstoppable},
    removeEventListener: {value: removeEventListenerUnstoppable}
  });
}