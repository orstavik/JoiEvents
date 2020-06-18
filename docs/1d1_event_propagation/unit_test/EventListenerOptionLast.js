//target* => type+" "+capture => [lastCb, lastCbOptions]
const targetToTypeCapture = new WeakMap();

function getLast(target, type) {
  const dictToLastCb = targetToTypeCapture.get(target);
  return dictToLastCb && dictToLastCb[type];
}

function setLast(target, type, lastCb, options) {
  let dictToLastCb = targetToTypeCapture.get(target);
  dictToLastCb || targetToTypeCapture.set(target, dictToLastCb = {});
  if(dictToLastCb[type])
    return false;//we don't need to throw here..
  return dictToLastCb[type] = [lastCb, options];
}

function removePreviousLastIfItIsTheCb(target, type, cb) {
  let dictToLastCb = targetToTypeCapture.get(target);
  if(!dictToLastCb)
    return false;
  if(!dictToLastCb[type] || dictToLastCb[type][0] !== cb)
    return false;
  delete dictToLastCb[type];
  return true;
}

export function addEventListenerOptionLast(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerLast(type, cb, options) {
    const last = options instanceof Object && !!options.last;
    const lastEntry = getLast(this, type);
    let previousLast, previousLastOptions;
    if(lastEntry)
      [previousLast, previousLastOptions] = lastEntry;
    if (last && options.capture)
      throw new Error("last option can only be used with bubble phase (at_target bubble phase) event listeners");
    if (last && previousLast) {
      throw new Error("only one event listener {last: true} can be added to a target for the same event type and capture/bubble event phase.");
    } else if (last) {
      setLast(this, type, cb, options);
      addEventListenerOG.call(this, type, cb, options);
    } else if (previousLast) {
      this.removeEventListener(type, previousLast, previousLastOptions)
      addEventListenerOG.call(this, type, cb, options);
      this.addEventListener(type, previousLast, previousLastOptions);
    } else {
      addEventListenerOG.call(this, type, cb, options);
    }
  }

  function removeEventListenerLast(type, cb, options) {
    removePreviousLastIfItIsTheCb(this, type, cb);//todo this will return true if the removed listener also was "last".
    removeEventListenerOG.call(this, type, cb, options);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerLast});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerLast});
}