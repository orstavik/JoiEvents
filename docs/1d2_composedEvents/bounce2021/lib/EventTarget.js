const removedListeners = [];

import {propagate, EventOG, checkAndPreventNativeDefaultAction} from "./EventLoop.js";
import {} from "./GlobalEventHandlers.js";

const listeners = Symbol("listeners");

function eventTick(e, target, root) {
  const stackEmpty = propagate(e, target, root, getListeners, removeListener);
  stackEmpty && removedListeners.map(removeListenerImpl);
}

function onFirstNativeListener(e) {
  EventOG.stopImmediatePropagation.call(e);
  const composedPath = e.composedPath();
  eventTick(e, composedPath[0], composedPath[composedPath.length - 1]);
  checkAndPreventNativeDefaultAction(e);
}

function typeCheckListener(listen){
  return listen instanceof Function || listen instanceof Object && listen.handleEvent instanceof Function;
}

function typeAndPhaseIsOk(listener, type, phase) {
  return listener.type === type && (phase === 2 || (listener.capture && phase === 1) || (!listener.capture && phase === 3));
}

function getListeners(target, type, phase) {
  return target[listeners]?.filter(listener => typeAndPhaseIsOk(listener, type, phase)) || [];
}

function removeListener(listener) {
  listener && (listener.removed = true) && removedListeners.push(listener);
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
  if(!typeCheckListener(cb))
    return;
  const capture = options instanceof Object ? options.capture : !!options;
  if (getListener(this, type, cb, capture))
    return;
  const target = this;
  const passive = options instanceof Object && 'passive' in options ? options.passive : defaultPassiveValue(type, target);
  const once = options instanceof Object && 'once' in options && options.once;
  const listener = {target, type, cb, capture, passive, once};
  listener.realCb = onFirstNativeListener.bind(listener);
  //we don't use the listener object, but we need to bind the nativeEventListener to something to get a unique realCb.
  addListenerImpl(listener);
}

const removeEventListenerOG = EventTarget.prototype.removeEventListener;
EventTarget.prototype.removeEventListener = function (type, cb, options) {
  const capture = options instanceof Object ? options.capture : !!options;
  removeListener(getListener(this, type, cb, capture));
}

EventTarget.prototype.dispatchEvent = function (e, options) {    //completely override dispatchEvent
  if (e.eventPhase > 0)
    throw new Error('Re-dispatch of events is disallowed.');
  const root = options instanceof Object && options.root instanceof EventTarget ? options.root : e.composed ? window : this.getRootNode();
  eventTick(e, this, root);
}
//todo start explanation from dispatchEvent only. second step is addEventListener take-over.