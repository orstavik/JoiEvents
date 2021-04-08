function pathForPhase(path, phase) {
  return phase === 1 ? path.slice(1).reverse() : phase === 2 ? [path[0]] : phase === 3 ? path.slice(1) : [];
}

export class EventLoop {
  constructor(event, propagationContexts) {
    this.event = event;
    this.contexts = propagationContexts;
    this.doc = 0;
    this.phase = 0;
    this.target = 0;
    this.listener = -1;
    this.stopImmediate = event.__frame?.stopImmediate || [];
    this.stop = event.__frame?.stopImmediate || [];
    this.prevented = event.__frame?.stopImmediate || [];
    event.__frame = this;
  }

  next(getListeners) {
    this.listener++;
    main: for (; this.doc < this.contexts.length; this.doc++, this.phase = this.target = this.listener = 0) {
      if (this.stopImmediate[this.doc])
        continue main;
      const context = this.contexts[this.doc];
      for (; this.phase < 4; this.phase++, this.target = 0) {
        const path = pathForPhase(context.path, this.phase);
        for (; this.target < path.length; this.target++, this.listener = 0) {
          const target = path[this.target];
          const listenerEntries = getListeners(target, this.event.type, this.phase);
          for (; this.listener < listenerEntries.length; this.listener++) {
            if (!listener.removed)
              return listenerEntries[this.listener];
          }
          if (this.stop[this.doc])
            continue main;
        }
      }
    }
  }
}

const eventStack = [];

export function tick(e, propagationContexts, getListeners, removeListener) {
  const frame = new EventLoop(e, propagationContexts);
  eventStack.unshift(frame);
  for (let listener; listener = frame.next(getListeners);) {
    listener.once && removeListener(listener);
    listener.cb.call(listener.target, e);
  }
  if (frame !== eventStack.shift()) throw 'omg';
  return eventStack.length === 0;
}