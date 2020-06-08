# Pattern: SkipInLine

User driven events are events that originate from a user action. They are most commonly considered `UIEvent`

In the event loop, user-driven events have top priority. `UIEvent`s are stored in a "UIEvent macrotask queue" that has a higher priority than all other macrotasks that can be generated from script actions. Thus, `UIEvent`s added to the event loop will therefore be processed before all the other macrotasks we have generated so far, such as `setTimeout`, `setZeroTimeout`, `toggleTick`, `ratechangeTick` etc.

## HowTo: add a task in the UIEvent macrotask queue?

It is **impossible** to dispatch a `UIEvent` via event loop. Yes, you can **synchronously** dispatch a `UIEvent` such as `click` from script via `anElement.dispatchEvent(new MouseEvent("click"))`. But, this event will be processed *immediately*, it is **not queued asynchronously** in the event loop.
 
Instead, we must resort to a trick. We call this the trick the raceEvent trick.

## Pattern: SkipInLine *before* the user's event

The RaceEvent pattern relies on the following premises:

1. All native UIEvents that originate from a user action are dispatched **async**. That an event is dispatched *async* means that each event listener is run as a separate macrotask. Examples are `mousemove`, `keydown`, `touchstart`.

2. *Many* events that are **indirectly** triggered by a user action dispatch *async*. Examples are `click` (made up of a subset `mousedown` and `mouseup` event), `dblclick` (made up of two `click` events), `contextmenu` (made up of another subset `mousedown` and `mouseup` event), `submit` (default action of `<form>` elements when triggered by a `click` action). (Note that `submit` events triggered from script via `requestSubmit()` are dispatched sync, not async.)

3. *Some* events that are indirectly triggered by a user action dispatch *sync*. Event listeners for such events will run within the same macrotask, meaning that any microtasks within them will be delayed until the last event listener has finished processing. Examples are `reset` and `invalid`.

4. Most native UIEvents propagates past the `window`. The notable exception being the `submit` event which is `composed: false` and therefore might be prevented from propagating past the `window`.

To have a function "race" *before* one or more of these events and run in their own macrotask, we simply have to add an event listener that will run at the very beginning of the native, user-generated event. Because these events are `composed: false`, we do so by adding a so-called EarlyBird event listener:

```javascript
window.addEventListener("event-name", function earlyBird(){ /*...task goes here ...*/ }, {capture: true});
```


## References

  * dunno