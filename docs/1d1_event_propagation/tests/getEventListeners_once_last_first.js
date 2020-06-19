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
  entry.removed = false;
  entry.target = target;
  // Object.freeze(entry);
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
  const removed = typeListeners.splice(index, 1)[0];  //mutates the list in the targetToListeners
  removed.removed = true;//see line 96-97 in https://github.com/WebReflection/dom4/blob/master/src/event-target.js
  return removed;
}

const entryToOnceCb = new WeakMap();
const targetToLastEntry = new WeakMap();
const targetToFirstEntry = new WeakMap();

export function addEventTargetRegistry(EventTargetPrototype) {
  const ogAdd = EventTargetPrototype.addEventListener;
  const ogRemove = EventTargetPrototype.removeEventListener;

  function addEntry(entry) {
    //check first and last options for illegal combinations
    if (entry.last && entry.capture)
      throw new Error("last option can only be used with bubble phase (at_target bubble phase) event listeners");
    if (entry.first && !entry.capture)
      throw new Error("first option can only be used with capture phase (at_target capture phase) event listeners");
    const previousLastEntry = targetToLastEntry.get(entry.target);
    if (entry.last && previousLastEntry)
      throw new Error("only one event listener {last: true} can be added to the same target and event type.");
    const previousFirstEntry = targetToFirstEntry.get(entry.target);
    if (entry.first && previousFirstEntry)
      throw new Error("only one event listener {first: true} can be added to the same target and event type.");

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
    //last
    if (entry.last)
      targetToLastEntry.set(entry.target, entry);
    if (previousLastEntry)
      removeEntry(previousLastEntry);

    //first
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
}