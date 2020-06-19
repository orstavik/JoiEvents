const targetToListeners = new WeakMap();

//this thing returns immutable listeners
export function getEventListeners(target, type, phase) {
  const allListeners = targetToListeners.get(target);
  if (!allListeners)
    return [];
  if (!type && !phase)
    return allListeners.slice();
  if (!allListeners[type])
    return [];
  if (!phase || phase === Event.AT_TARGET)
    return allListeners[type].slice();
  if (phase === Event.CAPTURING_PHASE)
    return allListeners[type].filter(listener => listener.capture);
  if (phase === Event.BUBBLING_PHASE)
    return allListeners[type].filter(listener => !listener.capture);
  throw new Error("Illegal event phase for getEventListeners: phase can only be Event.BUBBLING_PHASE, Event.CAPTURING_PHASE, or Event.AT_TARGET.");
}

function findEquivalentListener(registryList, listener, useCapture) {
  return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
}

function makeEntry(target, type, listener, options) {
  const entry = options instanceof Object ?
    Object.assign({}, options, {listener, type}) :
    {listener, type, capture: !!options};
  entry.capture = !!entry.capture;
  entry.bubbles = !!entry.bubbles;
  entry.once = !!entry.once;
  entry.passive = !!entry.passive;
  entry.target = target;
  Object.freeze(entry);
  return entry;
}

function addListener(target, type, listener, options) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    targetToListeners.set(target, allListeners = {});
  let typeListeners = allListeners[type] || (allListeners[type] = []);
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index !== -1)
    return null;
  const entry = makeEntry(target, type, listener, options);
  typeListeners.push(entry);
  return entry;
}

function removeListener(target, type, listener, options) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    return null;
  let typeListeners = allListeners[type];
  if (!typeListeners)
    return null;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index === -1)
    return null;
  return typeListeners.splice(index, 1)[0];  //mutates
}

//unstoppable
//target* => cb* => type+" "+capture => cbOnce
function getCurrentRoot(event) {
  const root = event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
  return root === document ? window : root;
}

const stopPropagations = new WeakMap();//event => root => whenStopPropWasCalled
                                       //whenStopPropWasCalled:
                                       //  .stopPropagation() => {currentTarget, eventPhase}
                                       //  .stopImmediatePropagation() => true
function stopProp(event, value) {
  let eventToRoot = stopPropagations.get(event);
  if (!eventToRoot)
    stopPropagations.set(event, eventToRoot = new WeakMap());
  const root = getCurrentRoot(event);
  if (value === true || !eventToRoot.has(root))
    eventToRoot.set(root, value);
}

function isCurrentlyStopped(event) {
  const stopProp = stopPropagations.get(event)?.get(getCurrentRoot(event));
  if (!stopProp)        //the event has not been stopped under this root
    return false;
  if (stopProp === true)//the event has been called stopImmediatePropagation, under this root
    return true;
  //stopPropagation was first called on this currentTarget in this eventPhase
  if (stopProp.currentTarget === event.currentTarget && stopProp.eventPhase === event.eventPhase)
    return false;
  return true;
}
//target* => cb* => type+" "+capture => cbOnce
const stoppableWrappers = new WeakMap();

function makeKey(type, options) {
  return type + " " + !!(options instanceof Object ? options.capture : options);
}

function setWrapper(target, type, cb, options, wrapped) {
  let cbMap = stoppableWrappers.get(target);
  if (!cbMap)
    stoppableWrappers.set(target, cbMap = new WeakMap());
  let typeDict = cbMap.get(cb);
  if (!typeDict)
    cbMap.set(target, typeDict = {});
  const key = makeKey(type, options);
  if (typeDict[key])
    throw new Error("omg this should never happen.");
  typeDict[key] = wrapped;
}

function getWrapper(target, type, options, cb) {
  let cbMap = stoppableWrappers.get(target);
  if (!cbMap)
    return null;
  let typeDict = cbMap.get(cb);
  if (!typeDict)
    return null;
  return typeDict[makeKey(type, options)] || null;
}
//unstoppable


const entryToOnceCb = new WeakMap();
const targetToLastEntry = new WeakMap();
const targetToFirstEntry = new WeakMap();

export function addEventTargetRegistry(EventTargetPrototype, EventPrototype) {
  const ogAdd = EventTargetPrototype.addEventListener;
  const ogRemove = EventTargetPrototype.removeEventListener;

  function addEntry(entry) {
    let target = entry.target;
    let type = entry.type;
    let cb = entry.listener;
    let options = entry;

    //pre production
    //once
    if (entry.once) {
      options = Object.assign({}, options);
      options.once = false;
      cb = function (e) {
        removeEntry(entry);
        entry.listener.call(this, e);
      }
      entryToOnceCb.set(entry, cb);
    }
    //unstoppable
    if (!entry.unstoppable) {
      let onceCb = cb;
      cb = function (e) {
        !isCurrentlyStopped(e) && onceCb.call(this, e);
      }
      setWrapper(target, type, onceCb, options, cb);
    }
    //last
    const previousLastEntry = targetToLastEntry.get(entry.target);
    if (entry.last && previousLastEntry)
      throw new Error("only one event listener {last: true} can be added to the same target and event type.");
    if (entry.last)
      targetToLastEntry.set(entry.target, entry);
    if (previousLastEntry)
      removeEntry(previousLastEntry);

    //first
    const previousFirstEntry = targetToFirstEntry.get(entry.target);
    if (entry.first && previousFirstEntry)
      throw new Error("only one event listener {first: true} can be added to the same target and event type.");
    let removedFirsts;
    if (entry.first) {
      targetToFirstEntry.set(entry.target, entry);
      removedFirsts = targetToListeners.get(target)[type].slice();
      removedFirsts.pop();
      for (let previousEntry of removedFirsts)
        removeEntry(previousEntry);
    }

    //production
    ogAdd.call(target, type, cb, options);

    //post production
    //first
    if (removedFirsts)
      for (let previousEntry of removedFirsts)
        addEntry(previousEntry);
    //last
    if (previousLastEntry)
      addEntry(previousLastEntry);
  }

  function removeEntry(entry) {
    //once
    let cb = entryToOnceCb.get(entry) || entry.listener;
    //unstoppable
    cb = getWrapper(entry.target, entry.type, cb, entry) || cb;

    //last
    const lastForTarget = targetToLastEntry.get(entry.target);
    if (lastForTarget === entry)
      targetToLastEntry.delete(entry.target);
    //first
    const firstForTarget = targetToFirstEntry.get(entry.target);
    if (firstForTarget === entry)
      targetToFirstEntry.delete(entry.target);

    ogRemove.call(entry.target, entry.type, cb, entry);
  }

  function addEventListenerRegistry(type, listener, options) {
    //check options first for illegal combinations
    if (options instanceof Object && options.last && options.capture)
      throw new Error("last option can only be used with bubble phase (at_target bubble phase) event listeners");
    if (options instanceof Object && options.first && !options.capture)
      throw new Error("first option can only be used with capture phase (at_target capture phase) event listeners");

    //register/make the entry, will return null if equivalent listener is already added.
    const entry = addListener(this, type, listener, options);
    entry && addEntry(entry);
    //the inside of the system sees the more elaborate options object.
    //this will break the native getListeners in dev tools, but do nothing else.
  }

  function removeEventListenerRegistry(type, listener, options) {
    //removeListener returns null when there is no registered listener for the given type, cb, capture combo
    const entry = removeListener(this, type, listener, options);
    entry && removeEntry(entry);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerRegistry});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerRegistry});

  function stopPropagation() {
    stopProp(this, {currentTarget: this.currentTarget, eventPhase: this.eventPhase});
  }

  function stopImmediatePropagation() {
    stopProp(this, true);
  }

  Object.defineProperty(EventPrototype, "stopPropagation", {value: stopPropagation});
  Object.defineProperty(EventPrototype, "stopImmediatePropagation", {value: stopImmediatePropagation});
}