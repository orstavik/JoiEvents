# WhatIs: `.preventDefault()`

When you call `.preventDefault()` on a trigger event, you will cancel the DefaultAction or CascadeEvent scheduled to run immediately *after* the triggering event. If we consider DefaultActions as a subset of native CascadeEvents (which is ok to do), then `.preventDefault()` essentially *stops the event cascade*.

Thus, the principal difference between `.stopPropagation()` and `.preventDefault()` is that:
 1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of event cascade, and 
 2. `preventDefault()` halts the outer cycle of event cascade, without affecting the current, ongoing inner cycle of event propagation.

## Unstoppable and preventable EventCascades

All DefaultActions can be stopped by calling `.preventDefault()` on their triggering event (except scrolling from a passive touch event listener, more on this in the chapter on touch events). But, not all native CascadeEvents can be stopped using `.preventDefault()`: PreventableCascadeEvents vs. UnstoppableCascadeEvents.

### Preventable CascadeEvents

Some native CascadeEvents can be stopped by calling `.preventDefault()` on their triggering event, as if they were a DefaultAction. Examples are:
 * a `click` on an `<input type="submit">` in a `<form>` spawns a `submit` CascadeEvent that are dispatched on the `<form>` element,
 * `wheel` events on the `document` will trigger `scroll` events,
 * `click` events on the `<option>` in a select will spawn a `select` event on the `<select>` element,
 * todo more!! (input and form events)

<code-demo src="demo/PreventableCascadingEvent.html"></code-demo>

### Unstoppable CascadeEvents

Some native CascadeEvents are **unstoppable**. Examples are:

 *  `mouseup` event *must* trigger `click`, `contextmenu`, or `auxclick` events. Calling `.preventDefault()` on `mouseup` will *not* stop the `click` event from being triggered.

 *  `dblclick` cannot be prevented from `click`, i think.

 * todo make a list of all Unstoppable CascadeEvents.
 * todo, does all the Unstoppable native CascadeEvents have potential to be `isTrusted`?

But, why make some CascadeEvents unstoppable in the first place?  

1. Some native trigger events can spawn many different types of cascade events. For example might a `mouseup` event spawn both a `contextmenu`, `click`, and `auxclick` cascade event. But, it might be difficult for the developer to see this situation clearly, in an event listener on the trigger event. Calling `.preventDefault()` on `mouseup` might therefore cause confusion and for example block events such as `click` and`auxclick`, when the developer only intended to block `contextmenu`.

2. To provide security for users and web sites, the browser mark user- initiated events as `isTrusted`. Such `isTrusted` events cannot be reproduced by a script in retrospect, and the idea might therefore be that it is better to never block `isTrusted` events, than having thousands of developers trying in vain to recreate them. It is the classic dilemma of "the web browser nanny state" vs "Don't tempt developers with solutions that only lead to chaos and confusion".

In the next chapter, we will describe a method for blocking Unstoppable native CascadeEvents called StopTheUnstoppable.  

## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)

## old trash

However, the default action of browsers is often associated with their own specialized event. Except touchbased scrolling. 
Before the browser actually will scroll, it will dispatch a native, composed `scroll` event
*after* the `touchmove` event and *before* the task of actually scrolling the viewport.
The event order is touchmove (event) -> scroll (event) -> scroll (task).
To call `preventDefault()` on the `scroll` event will cancel the scroll task.
To call `preventDefault()` on the `touchmove` event will cancel the `scroll` event 
which in turn will cancel the scroll task. I don't think so.