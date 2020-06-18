//depends on the registry

//target* => type+" "+capture => [ cb, options ]
const targetToTypeCapture = new WeakMap();

function makeKey(type, options) {
  return type + " " + !!(options instanceof Object ? options.capture : options);
}

function getFirst(target, type, options) {
  const dictToFirstCb = targetToTypeCapture.get(target);
  return dictToFirstCb && dictToFirstCb[makeKey(type, options)];
}

function setFirst(target, type, firstCb, options) {
  let dictToFirstCb = targetToTypeCapture.get(target);
  dictToFirstCb || targetToTypeCapture.set(target, dictToFirstCb = {});
  const key = makeKey(type, options);
  if (dictToFirstCb[key])
    return false;//we don't need to throw here..
  return dictToFirstCb[key] = firstCb;
}

function removePreviousFirstIfItIsTheCb(target, type, cb, options) {
  let dictToFirstCb = targetToTypeCapture.get(target);
  if (!dictToFirstCb)
    return false;
  const key = makeKey(type, options);
  if (!dictToFirstCb[key] || dictToFirstCb[key] !== cb)
    return false;
  delete dictToFirstCb[key];
  return true;
}

export function addEventListenerOptionFirst(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerFirst(type, cb, options) {
    const first = options instanceof Object && !!options.first;
    const previousFirstCallback = getFirst(this, type, options);
    if (first && previousFirstCallback) {
      throw new Error("only one event listener {first: true} can be added to a target for the same event type and capture/bubble event phase.");
    }
    if (!first)
      return addEventListenerOG.call(this, type, cb, options);
    if (options instanceof Object && options.first && !options.capture)
      throw new Error("first option can only be used with capture phase (at_target capture phase) event listeners");
    const allListeners = getEventListeners(this, type);
    allListeners.pop();
    const index = allListeners.findIndex(listener => listener.first);
    if(index !== -1)
      allListeners.splice(index, 1);
    //first
    for (let listener of allListeners)
      this.removeEventListener(listener.type, listener.listener, listener);
    setFirst(this, type, cb, options);
    const res = addEventListenerOG.call(this, type, cb, options);
    for (let listener of allListeners)
      this.addEventListener(listener.type, listener.listener, listener);
    return res;
  }

  function removeEventListenerFirst(type, cb, options) {
    removePreviousFirstIfItIsTheCb(this, type, cb, options);//todo this will return true if the removed listener also was "first".
    removeEventListenerOG.call(this, type, cb, options);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerFirst});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerFirst});
}