# Problem: DeadLast

An EarlyBird captures an event *before* any other event listener. But, what if we wanted to do the opposite, catch an event at the very end? Naively, this might seem straight forward. To add an event last, we simply add a normal (`{capture: false}`) event listener on:
 * `window` for `{composed: true, bubbles: true}` events,
 * the shadowRoot for `{composed: false, bubbles: true}` events,
 * the `target` for `{bubbles: false}` events.

But. There are *two* problems with this strategy:

1. For non-bubbling events (ie. `{bubbles: false}`) the `target` can be anywhere. This means you can't add *one* event listener to *one* element that would run DeadLast for all instances of the requested event type.  

2. StopPropagationTorpedoes. `stopPropagation()` and `stopImmediatePropagation()`. If any other event listener calls either one of these methods *before* the event reaches the last target, then the *last* event listener will not run. It has been torpedoed. Thus, by adding an event listener last in the propagation path, you are only certain of two things:
 * it might not run as other event listeners might `stopPropagation()`, but
 * if it runs, it will run last.  

* In addition to this problem, the same problem of controlling the sequence of event listeners on the target remains.

## Conclusion

The second problem, the `stopPropagation()` torpedo, is insurmountable. Even on bubbling events and using extended event listeners such as:

`window.addEventListener("click", fun, {priority: Number.MIN_SAFE_INTEGER})`  

cannot ensure that `fun` will *run* at last. We therefore call this antipattern DeadLast.

## WhatIf: we could make it work?

A fairly simple and unobtrusive way to make a DeadLast event listener work, would be to add an event listener option `unstoppable: true`. Adding such an option to an event listener would render it immune from interference from `stopPropagation()` and `stopImmediatePropagation()`.

The problem with this option is that it is impossible to alter the native event propagation algorithm to support this method. The `dispatchEvent(..)` function might be monkeypatched, but events dispatched by the browser itself can not. 
   
## References

 * [MDN: bubbling and capturing](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Bubbling_and_capturing_explained)
