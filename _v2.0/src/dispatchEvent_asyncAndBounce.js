
//target.dispatchEvent(event, {bounce: true, async: true});
//will replace queueEvent from PropagationRootInterface.js

//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
// dispatchEvent(...) returns false if preventDefault() is called (here, no setDefault has been called after the last preventDefault()
//returns undefined when it is async. This is different than true or false,
//as there is no critical use-case in knowing the state of preventDefault() for async dispatches.
//that i can think of.

import {toggleTick} from "./toggleTick.js";

const eventLoopWannabe = [];   //simulates what the event loop does, kinda

//preventDefault blocks the bounce of default action
const original2 = EventTarget.prototype.dispatchEvent;
Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
  value: function (event, eventPropagationOptions) {
    if (!eventPropagationOptions?.bounce)
      return original2.call(this, event, eventPropagationOptions);

    Object.defineProperty(event, "bounce", {value: true, writable: false});
    original2.call(this, event, eventPropagationOptions);
    if (event.defaultPrevented)
      return false;
    const defaultAction = event.defaultAction;
    const next = /*todo eventPropagationOptions?.async &&*/ //todo don't know if these two have to be connected??
      eventLoopWannabe.find(task => task.event.bounce === event.bounce && task.event.type === event.type);
    if (next) {
      next.event.setDefault(defaultAction);
    } else {
      defaultAction && defaultAction(event);
    }
    return true;
  }
});

//the async method must be wrapped outside of all other event listeners that need to wait for it to finish.
//todo if we make a promise for the callback of toggleTick, then we could make it async, but that require some work and should be done in the toggleTick library first.
//todo that would be nice though, to be able to do "const result = await toggleTick(()=>return 42);"..
// It works with fetch, maybe we can do it with toggleTick and setTimeout too?
const original = EventTarget.prototype.dispatchEvent;
Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
  value: function (event, eventPropagationOptions) {
    if (!eventPropagationOptions?.async)
      return original.call(this, event, eventPropagationOptions);
    eventLoopWannabe.push({target: this, event, eventPropagationOptions});//todo I don't think I need target here.. I think I can just use this instead
    toggleTick(() => {
      const {target, event, eventPropagationOptions} = eventLoopWannabe.shift();
      original.call(target, event, eventPropagationOptions);
    });
  }
});

const original3 = EventTarget.prototype.dispatchEvent;
Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
  value: function (event, eventPropagationOptions) {
    if (event.composed)
      console.warn("try to avoid dispatching composed: true events. It is better practice to make events bounce instead of composed.");
    if (event.bubbles === false)
      console.warn("most events should bubble. Are you sure you don't want your event to bubble? There is rarely anything lost due to bubbling, and if you are concerned with the target of the event, it is better to check this target in the event listener function directly.");
    if (event.composed && eventPropagationOptions.bounce)   //todo should I have this error??
      throw new Error("bounce events cannot also be composed: true.");
    return original3.call(this, event, eventPropagationOptions);
  }
});