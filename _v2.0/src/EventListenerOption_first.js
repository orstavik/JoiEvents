const targetToListeners = new WeakMap(); //WeakMap target => Map (eventType[ capture] => [{listenerOptions + listenerCallback}])

const bubbleOptions = {capture: false};
const captureOptions = {capture: true};

function makeListener(target, type, listener, options) {
  if (options instanceof Object)
    options.capture = !!options.capture;
  else
    options = options ? captureOptions : bubbleOptions;
  const typePhase = listener.name + options.capture ? " capture" : "";       //Pronounced typeface ;)
  let wrapper = listener;
  if (options.once) {                                                         //we need to wrap the once functions
    wrapper = function (e) {
      target.removeEventListener(type, wrapper, options);
      listener(e);
    }
  }
  return Object.assign({}, options, {once: false, wrapper, type, listener, typePhase});
}

//returns false if the listener is already added
//returns -1 if you try to add a first event listener if another first listener is already added
//returns true when the event listener is added no problem
function setEventListener(target, listener) {
  const targetMap = targetToListeners.get(target);
  if (!targetMap)
    return targetToListeners.set(target, new Map([[listener.typePhase, listener]])) || true;//todo check the true value here?
  const listeners = targetMap.get(listener.typePhase);
  if (!listeners)
    return targetMap.set(listener.typePhase, [listener]) || true;                                  //todo check the true value here?
  if (listeners.find(oldListener => oldListener.listener === listener.listener))
    return false;
  if (listener.first && listeners.find(oldListener => oldListener.first))//checking to see that no two first event listeners are added.
    return -1;
  listeners.push(listener);
  return true;
}

//returns false if the listener is not registered
//returns listener object if the listener is removed.
function removeEventListener(target, type, capture, cb) {
  const targetMap = targetToListeners.get(target);
  if (!targetMap)
    return false;
  const typePhase = type + capture ? " capture" : "";       //Pronounced typeface ;)
  const listeners = targetMap.get(typePhase);
  if (!listeners)
    return false;
  const oldPosition = listeners.findIndex(oldListener => oldListener.listener === cb);
  if (oldPosition === -1)
    return false;
  return listeners.splice(oldPosition, 1);
}

export function addFirstEventListenerOption(proto) {

  const ogAdd = proto.addEventListener;
  const ogRemove = proto.removeEventListener;

  Object.defineProperties(proto, {
    addEventListener: {
      value: function (type, cb, options) {
        const listener = makeListener(this, type, cb, options);
        const addListener = setEventListener(this, listener)
        if (addListener === false) //same event listener function object already added for the same event type and phase for this node.
          return;
        if (addListener === -1)
          throw new Error("Cannot add two first event listeners to the same node for the same event type in the same bubble/capture phase.");
        ogAdd.call(this, type, listener.wrapper, listener);
      }
    },
    removeEventListener: {
      value: function (type, cb, options) {
        const listener = removeEventListener(this, type, options?.capture || !!options, cb);
        if (listener)
          return ogRemove.call(this, type, listener.wrapper, options);
      }
    }
  });
}

addFirstEventListenerOption(EventTarget.prototype);