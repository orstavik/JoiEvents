# WhatIs: `.preventDefault()`

When you call `.preventDefault()` on an event, you cancel the DefaultAction that is scheduled to run immediately *after* the event. But, what are these Default  

that is scheduled to be executed as soon as the current event has finished its propagation.  

## `.preventDefault()`

Developers *cannot* stop cascading events from being triggered. (Or can they, can I block `submit` from `click`? Yes, I think so?) If the browser  

Events that occur in the DOM can often have a default action associated with them:
`touch` the screen to scroll down; and `click` inside a link to browse. 
To control and block these actions in the app, the browser has added a specialized method
on the events that precede these actions: `preventDefault()`.

However, the default action of browsers is often associated with their own specialized event.
Before the browser actually will scroll, it will dispatch a native, composed `scroll` event
*after* the `touchmove` event and *before* the task of actually scrolling the viewport.
The event order is touchmove (event) -> scroll (event) -> scroll (task).
To call `preventDefault()` on the `scroll` event will cancel the scroll task.
To call `preventDefault()` on the `touchmove` event will cancel the `scroll` event 
which in turn will cancel the scroll task.

> If you don't like the defaultAction of events, you're not alone. This is how the spec itself describes it: 
> > "\[Activation behavior\] exists because user agents perform certain actions for certain EventTarget objects, e.g., the area element, in response to synthetic MouseEvent events whose type attribute is click. Web compatibility prevented it from being removed and it is now the enshrined way of defining an activation of something. " [Whatwg.org](https://dom.spec.whatwg.org/#eventtarget-activation-behavior)

## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)
