const removedListeners = [];

let ticker;
let organizer;

export function setTickOrganizer(tick, organizerCb) {
  ticker = tick;
  organizer = organizerCb;
}

function eventTick(e) {
  if (ticker(e, organizer, getListeners, removeListener))
    removedListeners.map(removeListenerImpl);
}

const listeners = Symbol("listeners");

function getListeners(target, type) {
  //todo add getting the handleEvent listeners here
  return target[listeners]?.filter(listener => listener.type === type) || [];
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
  removeListener(getListener(this, type, cb, capture));
}