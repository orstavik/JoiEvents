//depends on the registry

//target* => type+" "+capture => [ cb, options ]
const targetToTypeCapture = new WeakMap();

function getFirst(target, type) {
  const dictToFirstCb = targetToTypeCapture.get(target);
  return dictToFirstCb && dictToFirstCb[type];
}

function setFirst(target, type, firstCb) {
  let dictToFirstCb = targetToTypeCapture.get(target);
  dictToFirstCb || targetToTypeCapture.set(target, dictToFirstCb = {});
  if (dictToFirstCb[type])
    return false;//we don't need to throw here..
  return dictToFirstCb[type] = firstCb;
}

function removePreviousFirstIfItIsTheCb(target, type, cb) {
  let dictToFirstCb = targetToTypeCapture.get(target);
  if (!dictToFirstCb)
    return false;
  if (!dictToFirstCb[type] || dictToFirstCb[type] !== cb)
    return false;
  delete dictToFirstCb[type];
  return true;
}

export function addEventListenerOptionFirst(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerFirst(type, cb, options) {
    const first = options instanceof Object && !!options.first;
    const previousFirstCallback = getFirst(this, type);
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
    setFirst(this, type, cb);
    const res = addEventListenerOG.call(this, type, cb, options);
    for (let listener of allListeners)
      this.addEventListener(listener.type, listener.listener, listener);
    return res;
  }

  function removeEventListenerFirst(type, cb, options) {
    removePreviousFirstIfItIsTheCb(this, type, cb);//todo this will return true if the removed listener also was "first".
    removeEventListenerOG.call(this, type, cb, options);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerFirst});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerFirst});
}