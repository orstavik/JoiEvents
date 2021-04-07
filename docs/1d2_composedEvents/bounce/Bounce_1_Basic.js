//Basic version

//rule #2: all events propagate sync. No more async propagation for UI events. Which is good, because you can never
//         tell if an event is async or sync.
//rule #3: all adding of event listeners are dynamic.
//         No more special rule that event listeners on the same target(phase) can be removed, but not added.

//tip 1:   all event listeners are removed when the event stack is empty.
//tip 2:   AT_TARGET works 'the old way', as event listeners on the innermost target.
//         This means the sum of both capture and bubble event listeners run in insertion order, not necessarily capture before bubble.
//         It is my opinion that it might be better to always run capture before bubble, also at_target, but
//         the 'old way' is chosen because I guess that this will cause the least disturbances in existing web apps.
import {bounceSequence} from "./BouncedPath.js";

(function () {

  // function getPropagationRoot(el) {
  //   const root = el.getRootNode && el.getRootNode() || window;
  //   return root === document ? window : root;
  // }
  //
  // function makeBouncedPath(composedPath) {
  //   const docs = [];
  //   for (let el of composedPath) {
  //     const root = getPropagationRoot(el);
  //     const doc = docs.find(({root: oldRoot}) => oldRoot === root);
  //     doc ?                   //first encounter
  //       doc.path.push(el) :
  //       el instanceof HTMLSlotElement ?
  //         docs.push({root, path: [el]}) :
  //         docs.unshift({root, path: [el]});
  //   }
  //   return docs;
  // }
  //
  class EventFrame {
    constructor(event) {
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
})();