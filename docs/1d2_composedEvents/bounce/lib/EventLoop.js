class EventLoop {
  constructor(event, propagationContexts) {
    this.event = event;
    event.__frame = this;
    this.contexts = propagationContexts;
    this.doc = 0;
    this.phase = 0;
    this.target = 0;
    this.listener = -1;
  }

  next(getListeners) {
    this.listener++;
    for (; this.doc < this.contexts.length; this.doc++, this.phase = 0) {
      const context = this.contexts[this.doc];
      const path = context.path;
      for (; this.phase < 2; this.phase++, this.target = 0) {
        for (; this.target < path.length; this.target++, this.listener = 0) {
          if (this.phase === 0 && this.target === path.length - 1) continue; //skip at_target during capture
          const elCapBub = this.phase ? this.target : path.length - 1 - this.target;
          const target = path[elCapBub];
          const listenerEntries = getListeners(target, this.event.type);
          for (; this.listener < listenerEntries.length; this.listener++) {
            const listener = listenerEntries[this.listener];
            if ((this.phase === 1 && this.target === 0) || listener.capture ^ this.phase)
              return listener;
          }
        }
      }
    }
    this.listener = -1;
  }
}

const eventStack = [];

export function tick(e, eventTargetOrganizer, getListeners, removeListener) {
  const composedPath = e.composedPath();
  const propagationContexts = eventTargetOrganizer(composedPath[0], composedPath[composedPath.length - 1]);
  const frame = new EventLoop(e, propagationContexts);
  eventStack.unshift(frame);
  e.stopImmediatePropagation();
  for (let listener; listener = frame.next(getListeners);) {
    listener.once && removeListener(listener);
    listener.cb.call(listener.target, e);
  }
  if (frame !== eventStack.shift()) throw 'omg';
  return eventStack.length === 0;
}