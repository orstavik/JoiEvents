# HowTo: listen to and dispatch events in event components

## HowTo: listen forevents in event components

You have two sets of events:

1. external (either window target events, or composed true events). Make sure that the `target` of the external event is relevant. This event must be intercepted as an EarlyBird. Do not call stopPropagation in an EarlyBird unless you intend to block the event for all contexts. And this should not likely be done by a web component, blocking an event for all contexts should likely only be done in the main, top-level lightDOM. 

   The reaction to these events, either if it is a dispatch of a future-tense notification, a state change, and/or a past-tense notification should be added as a defaultAction! Both such state changes and such cascade events should be queued in the event loop. As default actions. That can be prevented. or not. 

2. internal  (`composed: false`) events. They represent a state change in one of the internal elements. These events can safely be listened for inside the shadowDOM, but be aware of ComposedFalsePropagateDown problems if the target of these events are slotted into an internal web component. 

   They are quite simple. You can listen normally. State changes that happen inside the web component *can* sometimes be done sync. If the action is "finished" when you need to dispatch the event, then you can dispatch the event sync at the tail end of the action. This might be what you want, if you can make it so. But, if the action is not finished, ie. the action might be able to trigger other side-effects too later in its execution, then you must delay the event dispatch in the event loop as a toggleTick task so that you ensure that you events propagation does not nest into an ongoing state change.
   
## HowTo: dispatch an event from a web component

The `targetElement.dispatchEvent(event)` method dispatch an event that "propagates *sync*". That the event "propagates sync" means that any microtask queued from one event listener for that event will run *after* all the other event listeners for that event have completed too. (to dispatch an event to *run async*, like for example the native `click` does, cannot be done without setting up a completely new JS event propagation system.)

But, `targetElement.dispatchEvent(event)` also *starts the event propagation immediately*: the first event listener is triggered as the very next action, and the statement and flow of control in the frame that calls `dispatchEvent(...)` only continues when the dispatch event continues. The method `dispatchEvent(...)` does not delay the propagation of the event at all.
 
To delay the propagation of the event is simple: simply wrap the call to `dispatchEvent(...)` in a `setTimeout()` or `toggleTick()`.

A simple invocation of `dispatchEvent(...)` with no external wrapping/delay that starts the new events event listeners immediately is a "*sync* event dispatch". An "*async* event dispatch" delays the call to `dispatchEvent(...)` in the event loop using `setTimeout()`, `toggleTick()`, or similar, so that any remaining event listeners for the current event (either propagates both sync and async) completes first. (It is the consideration of microtasks queued from event listeners, as well as the behavior of async propagation that makes the microtask insufficient as a means to delay the dispatch of new events.)

## sync vs. async

So, if a web component needs to dispatch an event, either a past-tense or future-tense event, should this event be dispatched sync or async?

The main problem with:
 * sync event dispatch is nested propagation. We don't want it.
 * async event dispatch is boomerang state changes. We don't want that either.
 
Boomerang state changes is a state change that is queued early on (the boomerang is thrown out), but then forgotten about, and which comes back and hits you in the head when you least expect it. And kills your app.

If the state change:
1. informs about a past-tense or future-tense state change internal to your your web component,
2. is triggered by someone calling a method on the host node in the lightDOM, and
3. the dispatched event is `composed: false`,

   then you *can* dispatch the event sync.

In all other cases, you should dispatch the event async, ie. delay its execution in the event loop. There are some notes to be taken here:

1. if the change is triggered by an attribute change on the host node, which will be observed from either an `attributeChangeCallback(...)` or a `MutationObserver`, then you must delay its execution in the event loop. The reason for this is that the `attributeChangeCallback(...)` or `MutationObserver` will delay the call in the microtask queue, and this is not *enough* of a delay as it might be mixed up with other microtasks queued from event listeners and especially other event listeners when the event propagation context from which the attribute is changed is *sync*. Cf. the `toggle` event on `<details>` elements.

2. events that alert about external state changes, should be `composed: true`. These events can bubble up and across several DOM contexts, and therefore it will confuse upper event contexts if their event listeners suddenly ran nested.
 
3. Future-tense events must also delay the state change task that it accompanies. This is necessary to make it "future-tense" and also to have the mechanisms of `preventDefault()` run as planned. (If not, you end up with the CheckboxCtrlZ antipattern).
 
4. Past tense events should execute the state change immediately, and only queue the async dispatch of the event. Cf. the `open` attribute changing immediately, while the `toggle` event informing about it is delayed in the event loop).

## Examples of native element dispatch

both in the main DOM and esync event dispatch

* `reset`: The call to reset can be sync. Because the `reset` event is `composed: false`. But requestSubmit should be queued async, because the submit event should be composed.
  Toggle could be queued sync, since it is composed:false, but it is queued async. This is likely because it runs slightly async to begin with, being triggered by an attribute observer task on the open attribute, and is likely to be considered less confusing if it is fully async (event loop queue), than partially async (the microtask queue).

sync dispatch of events and nested propagation vs async dispatch of events and sequential propagation. When is it correct to do what? If all calls to an element happens in the main dom, then sync is good. The same goes for composed:false events. They can be dispatched sync. But. If call to a dispatch of another element that triggers a composed event (either indirectly or directly) inside a web component, then this should be queued async so that the "automatically generated" events in the main dom (or more precisely the upper lightdom) run sequentially, and not nested. This is the main goal.



   
```html


```
   
    