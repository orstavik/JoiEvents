/*If possible a passive EventListenerOptions*/
let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, "passive", {
    get: function () {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
  window.removeEventListener("test", null, opts);
} catch (e) {
}
const capturePassive = supportsPassive ? {capture: true, passive: true} : true;

class CustomEvents {

  constructor() {
    this.eventToClass = {};
  }

  static _processTriggerEvent(event) {
    const composedPath = event.composedPath();
    const CascadeEventFunctions = new Set(customEvents.eventToClass[event.type]);

    //3a. we loop first up the target chain, and then we check each of the ComposedEventClasses match functions ONCE
    for (let el of composedPath) {
      for (let CascadeEventClass of CascadeEventFunctions) {
        if (!CascadeEventClass.matches(event, el))
          continue;
        CascadeEventFunctions.delete(CascadeEventClass);
        CascadeEventClass.triggerEvent(event);             //the triggerEvent methods need to look to see if event.defaultPrevented = true.
      }
    }
  }

  define(CascadeEventClass) {
    for (let eventType of CascadeEventClass.observedEvents) {
      if (!this.eventToClass[eventType]) {
        this.eventToClass[eventType] = new Set();
        window.addEventListener(eventType, CustomEvents._processTriggerEvent, capturePassive);
      }
      this.eventToClass[eventType].add(CascadeEventClass);
    }
  }

  undefine(CascadeEventClass) {
    for (let eventType of CascadeEventClass.observedEvents) {
      this.eventToClass[eventType].delete(CascadeEventClass);
      if (this.eventToClass[eventType].size === 0) {
        delete this.eventToClass[eventType];
        window.removeEventListener(eventType, CustomEvents._processTriggerEvent, capturePassive);
      }
    }
  }
}

window.customEvents || (window.customEvents = new CustomEvents());

// queueEventLoopTasks(tasks) {
//   if (tasks instanceof Function)
//     toggleOnDetails(tasks);
//   if (!(tasks instanceof Array))
//     throw new Error("customEvents.queueEventLoopTasks() must receive only a single function or an array of functions.");
//   for (let task of tasks) {
//     if (!(task instanceof Function))
//       throw new Error("customEvents.queueEventLoopTasks() must receive only a single function or an array of functions.");
//   }
//   for (let task of tasks)
//     toggleOnDetails(task);
// }