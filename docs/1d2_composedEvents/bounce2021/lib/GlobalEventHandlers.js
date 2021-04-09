function typeCheckListener(listen){
  return listen instanceof Function || listen instanceof Object && listen.handleEvent instanceof Function;
}

const cache = new WeakMap();

function getFromCache(target, event) {
  const dict = cache.get(target);
  return dict ? dict[event] : undefined;
}

function putInCache(target, event) {
  const dict = cache.get(target);
  return dict ? dict[event] : undefined;
}

const events = ["abort", "animationcancel", "animationend", "animationiteration", "auxclick", "blur", "cancel", "canplay", "canplaythrough", "change", "click", "close", "contextmenu", "cuechange", "dblclick", "durationchange", "ended", "error", "focus", "formdata", "gotpointercapture", "input", "invalid", "keydown", "keypress", "keyup", "load", "loadeddata", "loadedmetadata", "loadend", "loadstart", "lostpointercapture", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "pause", "play", "playing", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointermove", "pointerout", "pointerover", "pointerup", "reset", "resize", "scroll", "select", "selectionchange", "selectstart", "submit", "touchcancel", "touchstart", "transitioncancel", "transitionend", "wheel"];
const interfaces = [Document, HTMLElement, SVGElement, Window];

for (let event of events) {
  const handler = "on" + event;
  const prop = {
    enumerable: true,
    configurable: true,
    get: function () {
      return getFromCache(this, event);
    },
    set: function (fun) {
      const oldFun = getFromCache(this, event);
      if (oldFun)
        this.removeEventListener(event, oldFun);
      const isListener = typeCheckListener(fun);  //note type checking is done after the old event listener is removed.
      putInCache(this, isListener ? fun: undefined);
      isListener && this.addEventListener(event, oldFun);
      return fun;
    }
  };
  for (let iface of interfaces)
    Object.defineProperty(iface.prototype, handler, prop);
}