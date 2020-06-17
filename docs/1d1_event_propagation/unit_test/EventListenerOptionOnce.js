//target* => cb* => type+" "+capture => cbOnce/cb
const targetToCb = new WeakMap();

function getOnceFromTargetCbTypeCapture(target, cb, type, capture) {
  const dictToRealCb = targetToCb.get(target)?.get(cb);
  return dictToRealCb && dictToRealCb[type + " " + capture];
}

function setOnceFromTargetCbTypeCapture(target, cb, type, capture, realCb) {
  let cbToDict = targetToCb.get(target);
  cbToDict || targetToCb.set(target, cbToDict = new WeakMap());

  let dictToRealCb = cbToDict.get(cb);
  dictToRealCb || cbToDict.set(cb, dictToRealCb = {});

  dictToRealCb[type + " " + capture] = realCb;
}

function removeOnceFromTargetCbTypeCapture(target, cb, type, capture) {
  let cbToDict = targetToCb.get(target);
  cbToDict || targetToCb.set(target, cbToDict = new WeakMap());

  let dictToRealCb = cbToDict.get(cb);
  dictToRealCb || cbToDict.set(cb, dictToRealCb = {});
  if (!dictToRealCb[type + " " + capture])
    return false;
  delete dictToRealCb[type + " " + capture];
  return true;
}

export function patchEventListenerOptionOnce(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerOnce(type, cb, options) {
    //the cb is already added, either once or not
    const capture = !!(options instanceof Object ? options.capture : options);
    if (getOnceFromTargetCbTypeCapture(this, cb, type, capture))
      return;//todo this is not necessary if the method addEventListener has already been checked (ie. something runs on the outside doing the same check, such as the registry).
    let realCb = cb;
    if (options?.once) {
      realCb = function (e) {
        this.removeEventListener(type, cb, options);//this is the patch.. that the removeEventListener goes via the JS method, not happens in the background..
        cb(e);
      }
      options = Object.assign({}, options, {once: false});//todo this assumes the once patch runs on a lower level than the registry.
    }
    setOnceFromTargetCbTypeCapture(this, cb, type, capture, realCb);
    addEventListenerOG.call(this, type, realCb, options);
  }

  function removeEventListenerOnce(type, cb, options) {
    const capture = !!(options instanceof Object ? options.capture : options);
    const realCb = getOnceFromTargetCbTypeCapture(this, cb, type, capture);
    //todo this is not necessary if the method addEventListener has already been checked
    // (ie. something runs on the outside doing the same check, such as event listener registry
    if (!realCb)
      return;
    removeOnceFromTargetCbTypeCapture(this, cb, type, capture);
    removeEventListenerOG.call(this, type, realCb, options);
  }


  EventTargetPrototype.addEventListener = addEventListenerOnce;//todo Object.defineProperty
  EventTargetPrototype.removeEventListener = removeEventListenerOnce;
}