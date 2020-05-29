import {findLowerNativeAction} from "./nativeDefaultActions.js";

function lastBubblePhaseNode(event) {
  const path = event.composedPath();
  if (event.bubbles) return path[path.length - 1];
  if (!event.composed) return path[0];
  //non-bubbling and composed
  let last = event.target;
  for (let i = 1; i < path.length - 2; i++) {
    if (path[i] instanceof ShadowRoot)
      last = path[++i];
  }
  return last;
}

//require unstoppable and last event listener option.
const preventedEvents = new WeakMap();
const eventToDefaultAction = new WeakMap();

const preventDefaultOG = Event.prototype.preventDefault;
Object.defineProperties(Event.prototype, {
  "setDefault": {
    value: function (cb) {
      if (!(cb instanceof Function))
        throw new Error("event.setDefault(cb) must be given a function as an argument. If you want to 'null out' a defaultAction, call preventDefault().");

      //adding a default action before the event is dispatched.
      //before the event is dispatched, calling setDefault(cb) will simply overwrite the value of the default action.
      if (this.eventPhase === 0)             //todo this depends on the assumption that the browser never adds any default actions to events that are dispatched from a script. Is this correct?? If not, can we call preventDefault() on such an event before it is dispatched??
        return eventToDefaultAction.set(this, cb);

      if (this.eventPhase === Event.CAPTURING_PHASE)
        throw new Error("event.setDefault(cb) must be called during the bubble phase!!! If not the implied logic breaks down. Do not do element.addEventListener(type, function(e){ ...e.setDefault(...)}, TRUE)!!! ");
      //Be aware, AT_TARGET-capture phase on host nodes, don't know how to fix this problem.
      //ie. if you do webCompWithShadowDom.addEventListener("click", e=> e.setDefault(...), true),
      // and the click is triggered on an element inside the shadowRoot of webCompWithShadowDom, you will not get an error msg.

      //we assume here that we are in the bubble phase.
      //If a custom defaultAction is already added, ie. it has been placed there from a lower DOM context,
      //then this already added, inner defaultAction should override this current, outer default action.
      //If an outer element wishes to override an inner default action (or wrap it), then it must call preventDefault() first.
      //comment. there is a possibility of instead of being cancelled, the default actions could be added one after the other.
      //This would better support the native default actions that now cannot be mocked, such as contextmenu and <select> selection.
      if (eventToDefaultAction.has(this))
        return;

      //if there is no ._defaultAction, that still doesn't mean that there might not already be a native default action.
      //to find this out, we need to query the entire composedPath up to this point, to see if there is a native default action
      //on some of the inner elements in the propagation path for this event. If there are, we update the ._defaultAction
      //so that we don't have to query this event again if so be it.
      const nativeAction = findLowerNativeAction(this.composedPath(), preventedEvents.get(this), this.currentTarget, this);
      if (nativeAction) {
        eventToDefaultAction.set(this, nativeAction);
        return;
      }

      //there is no inner defaultAction, neither custom nor native (that has not already been cancelled).
      //We can now finally add our own custom default action.
      //We must here call preventDefault() so that any outer, slotting, native default action
      //(such as an <a href><web-comp></web-comp></a>) will not also run after the fact.
      //Calling the native preventDefault() here is a patch to fit this new custom behavior with the
      //existing, smoke'n'mirror native behavior.
      preventDefaultOG.call(this);
      //we must also unflag this event as no longer having been prevented.
      //An event that gets a first default action, then has this first default action prevented/cancelled,
      //and then gets a second default action, is no longer marked as having been prevented.
      preventedEvents.delete(this);

      //before we add the custom defaultAction function to the event,
      //we must patch events that the browser dispatches.
      //Events that the browser dispatches has no post-propagation callback that will run the custom defaultAction.
      //So, we must add it.
      //The post-propagation callback that runs the native default action is:
      // * an *unstoppable* event listener
      // * that is ensured to run *last* and only *once*
      // * added to the last node in the bubble propagation phase
      //     (which for bubbling events is simply the propagation root,
      //     but which for non-bubbling events, is the topmost host node in the propagation path).
      //The genious of using EventListenerOptions to implement the post-propagation callback here comes to its right.
      //If the unstoppable and last EventListenerOptions are not available, this event listener would most often work ok
      //anyway. It falls back gracefully.
      if (!eventToDefaultAction.has(this) && !this.bounce) {
        const lastBubbleNode = lastBubblePhaseNode(this);
        lastBubbleNode.addEventListener(this.type, function (e) {
          const action = eventToDefaultAction.get(e);
          action && action(e);
          //todo what should this be here?? here?? I think the above is correct/best, but check it out..
          //action && action.call(this, e);
        }, {once: true, last: true, unstoppable: true});
      }
      eventToDefaultAction.set(this, cb);
    }
  },
  "defaultAction": {
    get: function () {
      return eventToDefaultAction.get(this);
    }
  },
  "preventDefault": {
    value: function () {
      //todo bug in platform. When an event has finished propagation (isSpent), then it should have an eventPhase = 4 (COMPLETED)
      //todo When an event is not yet completed, it should have an event phase = 0 (NOT_YET_DISPTACHED)
      if (this.eventPhase === 0)
        return;
      if (this.eventPhase === Event.CAPTURING_PHASE)
        throw new Error("event.preventDefault() should not be called during the capture phase!!! If so, inner default actions will still be registered.");
      //Be aware, AT_TARGET-capture phase on host nodes, don't know how to fix this problem.
      //ie. if you do webCompWithShadowDom.addEventListener("click", e=> e.preventDefault(...), true),
      //and the click is triggered on an element inside the shadowRoot of webCompWithShadowDom,
      //you will not get an error msg even though preventDefault() is called too soon.

      //preventing custom default action
      const previousAction = eventToDefaultAction.get(this);
      if (previousAction) {
        preventedEvents.set(this, this.currentTarget);
        //todo I think this should be the propagation root..
        // So that calling preventDefault() in a web comp will also preventDefault() on any parent <a href> element... hm...
        eventToDefaultAction.set(this, null);
        return previousAction;
      }
      //preventing native default action, inside from this scope
      const previousPrevent = preventedEvents.get(this);
      preventedEvents.set(this, this.currentTarget);
      //todo this I think should be the propagation root of the currentTarget element, not the currentTarget element itself..
      //todo this is more in line with how preventDefault() works now.. But it is less in line with how event Propagation should work... hm...
      const lowerNativeAction = findLowerNativeAction(this.composedPath(), previousPrevent, this.currentTarget, this);
      if (lowerNativeAction)//If there is an <a href> in an outer scope, then the native preventDefault() should not block this native default action
        preventDefaultOG.call(this);
      return lowerNativeAction;
    }
  },
  "defaultPrevented": {
    get: function () {
      return !!preventedEvents.get(this);
    }
  },
});

//disable closed shadowDOM.
const shadowOg = HTMLElement.prototype.attachShadow;
const alwaysOpen = {mode: "open"};
Object.defineProperty(HTMLElement.prototype, "attachShadow", {
  value: function (options) {
    options instanceof Object ? options.mode = "open" : options = alwaysOpen;
    return shadowOg.call(this, options);
  }
});

// const registry = new Map();        //this is a weak map, as it will die when the window dies  =8-)
// const wrapperRegistry = new WeakMap(); //this is a weak map, as it will die when the window dies  =8-)
// const captureOptions = {capture: true}, bubbleOptions = {};
// const addEventListenerOg = Window.prototype.addEventListener;
// const removeEventListenerOg = Window.prototype.removeEventListener;
// Object.defineProperty(Window.prototype, "removeEventListener", {
//   value: function (type, listener, options) {
//     options = options instanceof Object ? options : options ? captureOptions : bubbleOptions;
//     if (options.first)
//       listener = wrapperRegistry.get(listener);
//     const prevListeners = registry[type] || (registry[type] = []);
//     const index = prevListeners.findIndex(entry =>
//       entry.listener === listener && entry.options.capture === options.capture
//     );
//     prevListeners.splice(index, 1);
//     return removeEventListenerOg.call(this, type, listener, options);
//   }
// });
// Object.defineProperty(Window.prototype, "addEventListener", {
//   value: function (type, listener, options) {
//     options = options instanceof Object ? options : options ? captureOptions : bubbleOptions;
//     const prevListeners = registry[type] || (registry[type] = []);
//     const hasOtherListeners = prevListeners.length > 0;
//     const alreadyHasFirst = hasOtherListeners && prevListeners[0].first;
//
//     if (options.first && !options.capture)
//       throw new Error("'first' event listeners must be added with the capture event listener option.");
//     if (alreadyHasFirst && options.first)
//       throw new Error(
//         "There can be only one 'first' event listener. " +
//         "The first event listener must be removed first " +
//         "before another first event listener can be added.");
//
//     if (options.first) {
//       const wrapper = function (e) {
//         e[firstSymbol] = true;
//         listener.call(this, e);
//         delete e[firstSymbol];
//       }
//       wrapperRegistry.set(listener, wrapper);
//
//       for (let listener of prevListeners)
//         removeEventListenerOg.call(this, listener.type, listener.listener, listener);
//       prevListeners.unshift(Object.assign({}, options, {listener: wrapper, type}));
//       for (let listener of prevListeners)
//         addEventListenerOg.call(this, listener.type, listener.listener, listener);
//       return;
//     }
//
//     if (!options.first) {
//       prevListeners.push(Object.assign({}, options, {listener, type}));
//       return addEventListenerOg.call(this, type, listener, options);
//     }
//   }
// });

// const dispatchOg = DocumentFragment.prototype.dispatchEvent;
// Object.defineProperty(DocumentFragment.prototype, "dispatchEvent", {
//   value: function (event) {
//     if (!event.composed)
//       throw new Error("shadowRoot.dispatchEvent() is disabled for composed: false events.");
//     return dispatchOg.call(this, event);
//   }
// });
