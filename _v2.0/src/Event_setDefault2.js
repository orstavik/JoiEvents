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

const eventToDefaultActions = new WeakMap();
const eventToNativeDefaultActions = new WeakMap();

function runDefaultActions(e) {
  for (let cb of eventToDefaultActions.get(e)/*||[] todo should i do this, allow the default action to run unhindered*/) {
    try {
      cb(e);
    } catch (err) {
      const error = new ErrorEvent(
        'error',
        {error: err, message: 'Uncaught Error: a default action on ' + e.type + ' broke down'}
      );
      dispatchEvent(window, error);
      if (!error.defaultPrevented)
        console.error(error);
    }
  }
}

//will only add a default action, if no default action is set already.
//to force a new defaultAction, simply call .preventDefault() first and setDefault() second from on the outside.
//returns true when the new defaultAction is set, false when a lower default action already exists
export function setDefault(shadowRoot, event, cb) {
  //1. check that there are no custom default action set for the event.
  if (eventToDefaultActions.has(event))
    return false;
  //2a. check for native default actions already added to the event
  if (eventToNativeDefaultActions.has(event)) //todo is this caching necessary??
    return false;
  //2. check that there are no native default actions from the target and below.
  const nativeDefaultActionElement = getNativeDefaultAction(event, event.currentTarget);
  if (nativeDefaultActionElement){
    eventToNativeDefaultActions.set(event, nativeDefaultActionElement);  //todo is this caching necessary??
    return false;
  }

  //3. if there are no default actions below, then call native.preventDefault to block any upper slotDefaultActions
  //todo should we do this?? or should we leave this up to the developer??
  //todo if we don't, then we need to have a hasDefaultAction(event, level)
  //if (!hasDefaultAction(event, event.currentTarget)){
  //  event.preventDefault(); //cancels above default actions.. but this should not really be done..
  //  todo also, the native default actions will always run at the end.
  //  event.setDefault(cb);
  //}
  event.preventDefault();

  //4. add the cb to the list of custom default actions
  eventToDefaultActions.set(event, [cb]);

  //5. and add an unstoppable, once, last postPropagation callback where the default action will reside.
  shadowRoot.addEventListener(event.type, runDefaultActions, {
    unstoppable: true,
    last: true,
    once: true,
    captureToTarget: true
  });
  return true;
}

//will add a default action to be run after other previous default actions have run
//returns true if the default action was added
export function addDefault(shadowRoot, event, cb) {
  //1. if there is a custom defaultAction, just add the cb to it and return
  const defaultActions = eventToDefaultActions.get(event);
  if (defaultActions){
    defaultActions.push(cb);
    return true;
  }
  //todo what to do here?? should addDefault() never prevent the nativeDefault actions? or should it preventUpperDefaultActions?
  //todo this has to do with the native default actions. They are always exclusive?? or are they??
  //todo I think maybe no. I think that maybe we should cast the native default actions as non-exclusive??
  //todo or no.. I think that may be confusing. But. It is not necessarily so that a default action always alters the visible DOM.
  //todo there may be default actions that simply observe in some sense.
  //2. check if there are any native default actions below.
  //3. check if there are any slotted native default actions above.
  // const lowerNativeDefaultActionElement = getNativeDefaultAction(event, event.currentTarget);
  // const path = event.composedPath();
  // const higherNativeDefaultActionElement = getNativeDefaultAction(event, path[path.length-1]);
  //
  //if there is a native default action below, we should not call native event.preventDefault();
  //but, what should we do if there are only a native default action above, but none below?
  //should addDefault not block the above default actions?

  //4. add the cb to the list of custom default actions
  eventToDefaultActions.set(event, [cb]);

  //5. and add an unstoppable, once, last postPropagation callback where the default action will reside.
  shadowRoot.addEventListener(event.type, runDefaultActions, {
    unstoppable: true,
    last: true,
    once: true,
    captureToTarget: true
  });
  return true;
}



// function checkForOpportunity(event) {
//todo unnecessary. this is solved by captureToBubble
  //if the setDefault() or addDefault() is called on the final target, that is no good.
  //we need to throw a warning here that alerts the user that the event listener cannot be placed on the target if the
  //default action should work, it should then be placed on the shadowRoot. No, this we can do ourselves..
  //this is the captureToBubble listener option.
// }

//todo principle 1, calling preventDefault NEVER works above the DOM context, it only works within the DOM context.
//todo principle 2, slotted defaultActions can only be appended to bubbling events. It makes no sense to add them to non-bubbling events??
//todo hasDefaultAction() works only for elements in this current DOM context, not slotted elements, nor elements above and below??
//todo hasSlottedDefaultAction() works for all the elements in the event that is slotted in *within* the current context.
//todo this is easy to implement as an excludeSlottedDefaultActions.
// below the element, so that if you want to check for default actions in the DOM context, ie. those affected

function hasDefaultAction(event){ //this is context specific, this uses the state of the event object.. all our methods are context specific
  //is there any event that should call preventDefault on upper contexts? no.. this breaks with the principle. but no again, cause this might occur in a slotted situation?? no.. no.. yes.. yes.. no.. max? what should we do?
  //if that happens, then the above
  //todo hasDefaultAction works from the scope of the shadowRoot.

                                  // "lower" then the shadowRoot/DOM context the propagation phase is currently in..
  //todo to find the root, we need to propagate up from the event.currentTarget to the nearest target instanceof ShadowRoot || target === window || lastTarget, for events on elements not connected to the DOM. Such as audio ratechange and image load.

}

//will block existing default actions
function preventDefault(event, cb) { //this is context specific, this uses the state of the event object.. all our methods are context specific
  //todo should only call preventDefault when there is a native default action "lower" then the shadowRoot/DOM context the propagation phase is currently in..
  //todo to find the root, we need to propagate up from the event.currentTarget to the nearest target instanceof ShadowRoot || target === window || lastTarget, for events on elements not connected to the DOM. Such as audio ratechange and image load.
  event.preventDefault();
  eventToDefaultActions.delete(event);
  const path = event.composedPath();
  path[path.length-1].removeEventListener(event.type, runDefaultActions, {
    unstoppable: true,
    last: true,
    once: true,
    captureToTarget: true
  });
  //todo is it actually not that big a deal if the event listener runs? Is it worth removing the event listener??
  //todo this i need to benchmark
  //todo, if we don't do this, then the simplicity of adding/removing the defaultAction callback is much enhanced.
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
