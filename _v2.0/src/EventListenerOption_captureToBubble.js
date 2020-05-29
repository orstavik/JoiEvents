//require unstoppable event listener option

const nonBubblingEvents = ["toggle", "load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "mouseenter", "mouseleave", "pointerenter", "pointerleave", "pointerleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

function nativeBubbleEvent(type) {
  return type.indexOf("-") >= 0 && nonBubblingEvents.indexOf(type) === -1;
}

Object.defineProperty(Event, "bubbles", {value: nativeBubbleEvent});

//will find a target in the bubble phase for the element.
//if the event is a bubbling event, then no target change.
//but, if the event is not bubbling, then there will be added an event listener

export function addCaptureToBubbleEventListenerOption(proto) {
  if (!(proto instanceof ShadowRoot || proto instanceof Document || proto instanceof Window))
    throw new Error("the captureToBubble and captureToTarget event listener option is only available for Propagation root elements.");
  const ogAdd = proto.addEventListener;
  const ogRemove = proto.removeEventListener;
  Object.defineProperties(proto, {
    addEventListener: {
      value: function (name, cb, options) {
        if (options?.captureToBubble && Event.bubbles(name)) {
          options.capture = false;
          options.unstoppable = true;//todo this shouldn't be added here??
        } else if (options?.captureToTarget || options?.captureToBubble) {
          options.capture = true;
          options.unstoppable = true;//todo this shouldn't be added here?? let that be up to the outside to decide?
          const og = cb;
          cb = function (e) {
            ogAdd.call(e.target, name, og, {once: true, unstoppable: true});
          };
        }
        return ogAdd.call(this, name, cb, options);
      }
    },
    removeEventListener: {
      value: function (type, cb, options) {
        if (options?.captureToBubble && nativeBubbleEvent(name)) {
          options.capture = false;
        } else if (options?.captureToTarget || options?.captureToBubble) {
          options.capture = true;
          cb = getWrappedCallback
        }


        return ogRemove.call(this, type, cb, options);
      }
    }
  });
}