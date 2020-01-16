import {addEventListenerFirst} from "./addEventListenerFirst.js";

const grabbed = Symbol("customEventsGrabbed");

function _processCascadeEvents(event) {

  //1. check if the event is grabbed, if it is grabbed, then we execute the grabber and nothing else.
  //   we do not need to call the cancelCascade on the other events, as this is done sync when the events are grabbed.
  //   we need to call the cancelCascade sync when we are grabbing, because it may be called from a timer.
  //
  //   problem, the _processCascadeEvents is passive.. is that a problem?
  //   I think not, I think that active event listeners should be controlled from outside.
  //   if we want, we can just add and an active event listener when we grab/free event
  const grabber = customEvents[grabbed][event.type];
  if (grabber) {
    event.preventDefault();
    event.stopImmediatePropagation();
    grabber[event.type + "Trigger"](event);
    updateCascadeClass(grabber);
    return;
  }

  //2. run the trigger functions up the composed path.
  //   when it is running through the cascade functions, if the cascade function is a cancelObserve, then we call cancel no matter what
  //   if the cascade function is a triggerObserve, then we check if it matches first.
  //   if one of the trigger functions call e.preventDefault(), it is not only listening on the event, but is grabbing it
  //   this will cause the _process function to flip into cancel mode.
  //   in cancel mode, the process will cancel ALL other trigger functions, except the one that was already run.
  //   this could be a problem, because the cascadeEvent functions might have changed their state and listeners.
  //   but, if everybody has a cancelMethod with a fixed name, then the call to cancel can be made all the time.
  const path = event.composedPath();
  const observers = new Set(eventNamesToCascadeClasses[event.type]);
  const listeningTriggers = [];
  pathLoop: for (let el of path) {
    for (let observer of observers) {
      if (observer.observedPrevented.indexOf(event.type) >= 0) {
        observer.cancelCascade(event);
        observers.delete(observer);
        continue;
      }
      if (observer.observedTriggers.indexOf(event.type) >= 0 && observer.matches(event, el)) {
        observer[event.type + "Trigger"](event, el);
        observers.delete(observer);

        if (event.defaultPrevented) {                    //cancelMode
          for (let hasListened of listeningTriggers)
            hasListened.cancelCascade(event);
          for (let observer of observers)
            observer.cancelCascade(event);
          break pathLoop;
        }
        listeningTriggers.push(observer);
      }
    }
    if (observers.size === 0)
      break;
  }
  for (let cascadeEvent of eventNamesToCascadeClasses[event.type])
    updateCascadeClass(cascadeEvent);
}

const cascadeClassesToEventNames = new WeakMap();
const eventNamesToCascadeClasses = {};

function addCascadeClassListeners(eventNames, cascadeClass) {
  for (let name of eventNames) {
    eventNamesToCascadeClasses[name] || (eventNamesToCascadeClasses[name] = new Set());
    eventNamesToCascadeClasses[name].add(cascadeClass);
    if (eventNamesToCascadeClasses[name].size === 1)
      addEventListenerFirst(window, name, _processCascadeEvents, true);
  }
}

function removeCascadeClassListeners(eventNames, cascadeClass) {
  for (let name of eventNames) {
    eventNamesToCascadeClasses[name].delete(cascadeClass);
    if (eventNamesToCascadeClasses[name].size === 0)
      window.removeEventListener(name, _processCascadeEvents, true);
  }
}

function updateCascadeClass(cascadeClass) {
  const oldEventNames = cascadeClassesToEventNames.get(cascadeClass);
  const newEventNames = cascadeClass.getObservedNames();
  const added = newEventNames.filter(name => oldEventNames.indexOf(name) === -1);
  const removed = oldEventNames.filter(name => newEventNames.indexOf(name) === -1);
  addCascadeClassListeners(added, cascadeClass);
  removeCascadeClassListeners(removed, cascadeClass);
  cascadeClassesToEventNames.set(cascadeClass, newEventNames);
}

export class CustomEvents {

  constructor() {
    this[grabbed] = {};
  }

  define(CascadeEventClass) {
    if (cascadeClassesToEventNames.has(CascadeEventClass))
      throw new Error("EventCascadeClass: " + CascadeEventClass.name + " is already defined.");
    const eventNames = CascadeEventClass.getObservedNames();
    cascadeClassesToEventNames.set(CascadeEventClass, eventNames);
    addCascadeClassListeners(eventNames, CascadeEventClass);
  }

  undefine(CascadeEventClass) {
    if (!cascadeClassesToEventNames.has(CascadeEventClass))
      throw new Error("Cannot undefine EventCascadeClass: " + CascadeEventClass.name + " because it is not defined.");
    const eventNames = cascadeClassesToEventNames.get(CascadeEventClass);
    cascadeClassesToEventNames.delete(CascadeEventClass);
    removeCascadeClassListeners(eventNames, CascadeEventClass);
  }

  /**
   * An event can be grabbed by an EventCascadeController.
   * The grabbed callback is ALWAYS ACTIVE as grabbing an event also implies overriding any default action too.
   * By setting the grab event listener to be active, scrolling from touchstart (and wheel) will always be
   * turned off in Safari and delayed in Chrome. FF doesn't react as much to active controllers.
   *
   * Netscape navigator had two methods: releaseEvents and captureEvents. These methods are remnants of the browser
   * war between netscape and MS IE. They were replaced by .stopPropagation() when Netscape's trickle down (capture)
   * and IE's bubble up event order was merged into a unified capture+bubble propagation.
   *
   * @param names
   * @param owner
   */
  grabEvents(names, owner) {
    for (let name of names) {
      if (this[grabbed][name])
        throw new Error("Event type '" + name + "' has already been grabbed!");
    }
    for (let name of names) {
      this[grabbed][name] = owner;
      eventNamesToCascadeClasses[name] || (eventNamesToCascadeClasses[name] = new Set());
      //calling cancelCascade SYNC from grabEvents! Must be done to support grabEvent called from timers
      for (let cascadeEventClass of eventNamesToCascadeClasses[name]) {
        if (cascadeEventClass === owner)
          continue;
        cascadeEventClass.cancelCascade(name);
        updateCascadeClass(cascadeEventClass)
      }
      if (eventNamesToCascadeClasses[name].size === 0)
        addEventListenerFirst(window, name, _processCascadeEvents, true);
    }
  }

  freeEvents(names, owner) {
    for (let name of names) {
      if (!this[grabbed][name])
        throw new Error("Cannot free event '" + name + "' because it has not been grabbed.");
      if (this[grabbed][name] !== owner)
        throw new Error("Cannot free event '" + name + "' because it is owned by someone else.");
    }
    for (let name of names) {
      delete this[grabbed][name];
      if (eventNamesToCascadeClasses[name].size === 0)
        window.removeEventListener(name, _processCascadeEvents, true);
    }
  }

  /**
   * queue task in event loop
   */
  queueTask = function (cb) {
    if (!(cb instanceof Function))
      throw new Error("Only function references can be queued in the event loop.");
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = function () {
      details.remove();
      cb();
    };
    document.body.appendChild(details);
    details.open = true;
  }
}