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
      //todo type check the fun argument
      const oldFun = getFromCache(this, event);
      if (oldFun)
        this.removeEventListener(event, oldFun);
      putInCache(this, fun);
      this.addEventListener(event, oldFun);
    }
  };
  for (let interface of interfaces)
    Object.prototype.defineProperty(interface.prototype, handler, prop);
}