# WhatIs: UserEventQueue 

## WhatIs: `UIEvent`s?

When the user interacts with the browser via an interface such as mouse, keyboard and touch, the browser dispatches a **direct `UIEvent`** into the DOM that directly represents these actions (1)(2). Examples include `mousemove`, `keydown`, `touchstart`.

*Many* of these `UIEvents` trigger yet other events. There are many types of such events that can be indirectly triggered by a user action, but here we will focus on two groups: **synthetic `UIEvent`s** and `FormEvent`s. Examples of synthetic `UIEvent`s include:
 * `click` (made up of a subset `mousedown` and `mouseup` event), 
 * `dblclick` (made up of two `click` events), 
 * `contextmenu` (made up of another subset `mousedown` and `mouseup` event).
  
Examples of `FormEvent` are:
 * `submit` (default action of `<form>` elements when triggered by a `click` action), and
 * `input` (default action of `<input>`, `<textarea>` and `<select>` elements.
 
## HowTo: dispatch `UIEvents` and `FormEvent`?

When the browser dispatches a direct `UIEvent`, a synthetic `UIEvent` or a `FormEvent` as an automatic response to a user-driven input, it does so by queueing the event in the event loop, asynchronously. However, some of these `UIEvents` and `FormEvents` are also *propagates asynchronously*.
 
**An event that propagate async runs each event listener as a separate macrotask**. The most significant difference between events that propagate async and sync is:
 * an event listener for an async event will complete all the queued microtasks, if it can, before the control of flow is passed to the next event listener, while
 * an event that propagates sync will first run all its event listeners, and then all after the last event listener has run begin to process any micro task queued by one of its event listeners.

When the browser is driven by a user-action, it dispatches:
 * *all* its `UIEvents` async, both direct and synthetic, and
 * some of its `FormEvents` async, such as `beforeinput`, `submit` and `change`, and
 * some of its `FormEvents` sync, such as `invalid` and `reset`. (todo test this) 

When a script dispatches either a `UIEvent` or `FormEvent`, the browser will run it *sync*, always. In fact, there is no way to dispatch an event from script that will  does so When the browser dispatches *some* of its `FormEvents` async,   
 
Events that the browser dispatches *synchronThere are *two* important aspects of events that the browser dispatches ` Events queued   

. (Note that `submit` events triggered from script via `requestSubmit()` are dispatched sync, not async.)

For  `UIEvent`sthat are **indirectly** triggered by a user action dispatch *async*. 

These `UIEvent`s often trigger other events in the browser. For example, the  to trigger  other events  
  
  (internally represents this external action). Events driven by the . We call these events here "user events".

(

The browser gives these   
User driven events are events that originate from a user action. They are most commonly considered `UIEvent`

In the event loop, user-driven events have top priority. `UIEvent`s are stored in a "UIEvent macrotask queue" that has a higher priority than all other macrotasks that can be generated from script actions. Thus, `UIEvent`s added to the event loop will therefore be processed before all the other macrotasks we have generated so far, such as `setTimeout`, `setZeroTimeout`, `toggleTick`, `ratechangeTick` etc.

## HowTo: add a task in the UIEvent macrotask queue?

It is **impossible** to dispatch a `UIEvent` via event loop. Yes, you can **synchronously** dispatch a `UIEvent` such as `click` from script via `anElement.dispatchEvent(new MouseEvent("click"))`. But, this event will be processed *immediately*, it is **not queued asynchronously** in the event loop.
 
Instead, we must resort to a trick. We call this the trick the raceEvent trick.

## Pattern: SkipInLine *before* the user's event

The RaceEvent pattern relies on the following premises:

1. All native UIEvents that originate from a user action are dispatched **async**. That an event is dispatched *async* means that each event listener is run as a separate macrotask. Examples are.

2. 

3. *Some* events that are indirectly triggered by a user action dispatch *sync*. Event listeners for such events will run within the same macrotask, meaning that any microtasks within them will be delayed until the last event listener has finished processing. Examples are `reset` and `invalid`.

4. Most native UIEvents propagates past the `window`. The notable exception being the `submit` event which is `composed: false` and therefore might be prevented from propagating past the `window`.

To have a function "race" *before* one or more of these events and run in their own macrotask, we simply have to add an event listener that will run at the very beginning of the native, user-generated event. Because these events are `composed: false`, we do so by adding a so-called EarlyBird event listener:

```javascript
window.addEventListener("event-name", function earlyBird(){ /*...task goes here ...*/ }, {capture: true});
```


## Notes

1. Not all user interaction are dispatched into the DOM. For example, when the browser triggers the native `contextmenu`, an `alert(..)` or processes interaction with a `select`, the browser might quell some or all `UIEvent`s or some details on the `UIEvent`s.

2. Some events such as `resize`, `submit`, `reset` that are clearly user driven, either directly or indirectly, are not `UIEvent`s. The `UIEvent` does not specify the agent behind the change, but their anticipated role (and priority) in the running application.

## References

  * dunno