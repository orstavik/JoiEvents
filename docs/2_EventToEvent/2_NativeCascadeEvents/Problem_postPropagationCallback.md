# Problem: postPropagationCallback

In EventCascades, events propagate one-by-one. If event A trigger event B, then all event listeners for event A is processed first *before* the event listeners for B is processed. In essence, the function dispatching event B is triggered as soon as the event propagation of event A ends.

This point in time *immediately after the propagation of an event ends* we call **postPropagation**. And, when we create custom CascadeEvents, we need to call a function postPropagation: we need a **postPropagationCallback**. But how to achieve such a callback?

## Alternative strategies for **postPropagationCallback**

There are several alternatives to accomplish **postPropagationCallback**, some that do not work, and some that work in some instances. Unfortunately, there is no single solution that works in all instances.

Potential postPropagationCallback strategies:

1. Add a dynamic event listener at the end. **Does not work!!** because other event listeners may cancel the callback by calling `.stopPropagation()` or `stopImmediatePropagation()` midway through event propagation. 

2. Promises: ie. `Promise.resolve().then( callback )`. **Does not work!!** because callbacks delayed using `Promise` are processed *before* the next event listener function is called.    

3. `setTimeout(callback, 0)`. **Partial solution** with several issues.

4. `setZeroTimeout(callback)` using `postMessage()`. **Partial solution** with a minor benefit over `setTimeout(callback, 0)`.


## 2. Postpone/trigger function using setTimeout

This works, but is postponed *after* the defaultAction being run as well.
The defaultAction is queued at the same time as the

Two drawbacks, a) defaultAction runs before the postPropagationCallback
b) if more than approx. 5 setTimeout0 functions are nested inside this callback, then they will be clamped with 4ms. 

## 3. Postpone/trigger function using postMessage

Has the same drawback as using setTimeout0 with regards to defaultAction, but does not have the problem with of being clamped by 4ms.