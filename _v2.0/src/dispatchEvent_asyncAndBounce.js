window["nextTick"] = window["nextTick"] || setTimeout;           //implied import of nextTick, is this good or bad??

//target.dispatchEvent(event, {bounce: true, async: true});
//will replace queueEvent from PropagationRootInterface.js

//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
// dispatchEvent(...) returns false if preventDefault() is called (here, no setDefault has been called after the last preventDefault()
//returns undefined when it is async. This is different than true or false,
//as there is no critical use-case in knowing the state of preventDefault() for async dispatches.
//that i can think of.

const eventLoopWannabe = [];   //simulates what the event loop does, kinda

//the async method must be wrapped outside of all other event listeners that need to wait for it to finish.
//todo if we make a promise for the callback of toggleTick, then we could make it async, but that require some work and should be done in the toggleTick library first.
//todo that would be nice though, to be able to do "const result = await toggleTick(()=>return 42);"..
// It works with fetch, maybe we can do it with toggleTick and setTimeout too?
//todo really check this out, because then we could make this method async and have it return a promise with the result of the inner call.
function dispatchEventAsync(target, event, original) {
  if (!event.async)
    return original(target, event);
  eventLoopWannabe.push({target, event});
  nextTick(() => {
    const {target, event} = eventLoopWannabe.shift();
    original(target, event);
  });
}

function processEventOptions(event, eventPropagationOptions) {
  if (event.composed)
    console.warn("try to avoid dispatching composed: true events. It is better practice to make events bounce instead of composed.");
  if (event.bubbles === false)
    console.warn("most events should bubble. Are you sure you don't want your event to bubble? There is rarely anything lost due to bubbling, and if you are concerned with the target of the event, it is better to check this target in the event listener function directly.");
  if (event.composed && eventPropagationOptions.bounce)   //todo should I have this error??
    throw new Error("bounce events cannot also be composed: true.");
  Object.defineProperty(event, "bounce", {value: !!eventPropagationOptions?.bounce, writable: false});
  Object.defineProperty(event, "async", {value: !!eventPropagationOptions?.async, writable: false});
  // return original3.call(this, event);
}

const original = EventTarget.prototype.dispatchEvent;
function dispatchEventBounce(target, event) {
  const result = original.call(target, event);
  if (!event.bounce)
    return result;
  if (event.defaultPrevented)             //preventDefault blocks the bounce of default action
    return false;
  if (!event.defaultAction)
    return true;
  const next = eventLoopWannabe.find(t => t.event.bounce === event.bounce && t.event.type === event.type);
  next ? next.event.setDefault(event.defaultAction) : event.defaultAction(event);
  return true;
}

Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
  value: function (event, extraEventOptions) {
    processEventOptions(event, extraEventOptions); //this mutates the event object
    dispatchEventAsync(this, event, dispatchEventBounce);
  }
});