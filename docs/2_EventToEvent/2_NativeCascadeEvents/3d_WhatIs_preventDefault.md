# WhatIs: `.preventDefault()`

When you call `.preventDefault()` on a trigger event, you will cancel the DefaultAction or CascadeEvent scheduled to run immediately *after* the triggering event. If we consider DefaultActions as a subset of native CascadeEvents (which is ok to do), then `.preventDefault()` essentially *stops the event cascade*.

Thus, the principal difference between `.stopPropagation()` and `.preventDefault()` is that:
 1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of event cascade, and 
 2. `preventDefault()` halts the outer cycle of event cascade, without affecting the current, ongoing inner cycle of event propagation.

## Unstoppable and preventable EventCascades

All DefaultActions can be stopped by calling `.preventDefault()` on their triggering event (except scrolling from a passive touch event listener, more on this in the chapter on touch events).

But, not all native CascadeEvents can be stopped using `.preventDefault()`: PreventableCascadeEvents vs. UnstoppableCascadeEvents.

## Preventable CascadeEvents

Some native CascadeEvents can be stopped by calling `.preventDefault()` on their triggering event, as if they were a DefaultAction. Examples are:
 * a `click` on an `<input type="submit">` in a `<form>` spawns a `submit` CascadeEvent that are dispatched on the `<form>` element,
 * `wheel` events on the `document` will trigger `scroll` events,
 * `click` events on the `<option>` in a select will spawn a `select` event on the `<select>` element,
 * todo more!! (input and form events)

<code-demo src="demo/PreventableCascadingEvent.html"></code-demo>

## Unstoppable CascadeEvents

Some native CascadeEvents are **unstoppable**. Examples are:
 *  `mouseup` event *must* trigger `click`, `contextmenu`, or `auxclick` events. Calling `.preventDefault()` on `mouseup` will *not* stop the `click` event from being triggered.
 *  todo make a list of all Unstoppable CascadeEvents.

Why have the browser made some native CascadeEvents unstoppable, while others preventable? 

1. Some native trigger events can spawn many different types of cascade events. For example might a `mouseup` event spawn both a `contextmenu`, `click`, and `auxclick` cascade event. Calling `.preventDefault()` on `mouseup` might therefore cause confusion and for example block events such as `contextmenu`, when the developer only intended to block `click`.

2. To provide security for users and web sites, the browser can mark UI events initiated by the user as `isTrusted`. An `isTrusted` `click` created by the user pressing a mouse thus cannot be reproduced by a script in retrospect.   
A likely rational for making some CascadeEvents Unstoppable is that the developer cannot remake them from script. For example, user input event such as `click` might need to be marked as `isTrusted` to enable the browser to identify if the browser should or should not allow the event to trigger a BrowserAction of some kind. As these other events cannot be resurrected later, the browser does not enable the trigger event to cancel them.

Thus, the rule of thumb is: If the cascading event can be `isTrusted`, you cannot `preventDefault()` it. Todo. Verify this hypothesis??

Unstoppable CascadeEvents are queued like a defaultAction, and preceded by a trigger event. 

The only difference is that you cannot stop them by calling `.preventDefault()` on the trigger event.

 




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

## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)
