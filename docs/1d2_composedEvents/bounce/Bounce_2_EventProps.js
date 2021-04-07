//Event.props version
import {bounceSequence} from "./BouncedPath.js";

Object.defineProperties(Event.prototype, {
  'currentTarget': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? null : frame.bouncedPath[frame.doc].path[frame.target];
    }
  },
  'eventPhase': {
    get: function () {  //0 not_started/ended, 1 capture, 2 at_target, 3 bubble
      const frame = this.__frame;
      return frame.listener === -1 ? 0 : frame.phase === 0 ? 1 : frame.target === 0 ? 2 : 3;
    }
  },
  'path': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? [] : frame.bouncedPath[frame.doc].path.slice();
    }
  },
  'currentDocument': {
    get: function () {
      const frame = this.__frame;
      return frame.listener === -1 ? null : frame.bouncedPath[frame.doc].root;
    }
  },
  'bouncedPath': {
    get: function () { //returns a copy of the bouncedPath (preserving the original bouncedPath immutable).
      const frame = this.__frame;
      return frame.bouncedPath.map(({root, path}) => ({root, path: path.slice()}));
    }
  }
});

class EventFrame {
  constructor(event) {
    event.__frame = this;
    this.event = event;
    const composedPath = event.composedPath();
    this.bouncedPath = bounceSequence(composedPath[0], composedPath[composedPath.length - 1]);
    this.doc = 0;
    this.phase = 0;
    this.target = 0;
    this.listener = -1;
  }

  next() {
    this.listener++;
    for (; this.doc < this.bouncedPath.length; this.doc++, this.phase = 0) {
      const context = this.bouncedPath[this.doc];
      const path = context.path;
      for (; this.phase < 2; this.phase++, this.target = 0) {
        for (; this.target < path.length; this.target++, this.listener = 0) {
          if (this.phase === 0 && this.target === path.length - 1) continue; //skip at_target during capture
          const elCapBub = this.phase ? this.target : path.length - 1 - this.target;
          const target = path[elCapBub];
          const listenerEntries = target[listeners];
          if (listenerEntries) {
            for (; this.listener < listenerEntries.length; this.listener++) {
              const listener = listenerEntries[this.listener];
              if (listener.type !== this.event.type)
                continue;
              if ((this.phase === 1 && this.target === 0) || listener.capture ^ this.phase)
                return listener;
            }
          }
        }
      }
    }
    this.listener = -1;
  }
}

const listeners = Symbol("listeners");
const removedListeners = [];
const eventStack = [];

function eventTick(e) {
  const frame = new EventFrame(e);
  eventStack.unshift(frame);
  e.stopImmediatePropagation();
  for (let listener; listener = frame.next();) {
    listener.once && removedListeners.push(listener);
    listener.cb.call(listener.target, e);
  }
  if (frame !== eventStack.shift()) throw 'omg';
  eventStack.length === 0 && removedListeners.forEach(removeListenerImpl);
}

function getListener(target, type, cb, capture) {
  target[listeners] || (target[listeners] = []);
  return target[listeners].find(old => old.type === type && old.cb === cb && old.capture === capture && !old.removed);
}

function defaultPassiveValue(type, target) {
  return (type === 'touchstart' || type === 'touchmove') && (target === window || target === document || target === body);
}

function addListenerImpl(l) {
  l.target[listeners].push(l);
  addEventListenerOG.call(l.target, l.type, l.realCb, {capture: l.capture, passive: l.passive});
}

function removeListenerImpl(l) {
  l.target[listeners].splice(l.target[listeners].indexOf(l), 1);
  removeEventListenerOG.call(l.target, l.type, l.realCb, {capture: l.capture, passive: l.passive});
}

const addEventListenerOG = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, cb, options) {
  const capture = options instanceof Object ? options.capture : !!options;
  if (getListener(this, type, cb, capture))
    return;
  const target = this;
  const passive = options instanceof Object && 'passive' in options ? options.passive : defaultPassiveValue(type, target);
  const once = options instanceof Object && 'once' in options && options.once;
  const listener = {target, type, cb, capture, passive, once};
  listener.realCb = eventTick.bind(listener); //we don't use the listener object, but we need to bind the eventTick to something to get a unique realCb.
  addListenerImpl(listener);
}

const removeEventListenerOG = EventTarget.prototype.removeEventListener;
EventTarget.prototype.removeEventListener = function (type, cb, options) {
  const capture = options instanceof Object ? options.capture : !!options;
  const listener = getListener(this, type, cb, capture);
  listener && (listener.removed = true) && removedListeners.push(listener);
}