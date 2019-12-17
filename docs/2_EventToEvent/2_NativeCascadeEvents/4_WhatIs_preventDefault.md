# WhatIs: `.preventDefault()`

The principal difference between `.stopPropagation()` and `.preventDefault()` is that:
 1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of the EventCascade, and 
 2. `preventDefault()` halts the outer cycle of the EventCascade, without affecting the current, ongoing inner cycle of event propagation.

Put simply, if we view DefaultActions as a subset of native CascadeEvents, then `.preventDefault()` essentially means **stop the event cascade**.

## Problem: Preventable vs. Unstoppable EventCascades

When you call `.preventDefault()` on a trigger event, you will:
1. *always* cancel a subsequent DefaultAction associated with that trigger event 
   * *except* `Scrolling` in passive `touchstart` event listeners in Chrome,
   * and can pull to refresh be cancelled?? 
   * are there other non-cancelable DefaultActions?
2. *sometimes* cancel a CascadeEvent scheduled to run immediately *after* the triggering event, and sometimes not.

As you can see, `.preventDefault()` is *very inconsistent*. DefaultActions can as a rule be stopped from their preceding trigger event, with one notable exception. But for native CascadeEvents, `.preventDefault()` "works" only about half the time: 
* some CascadeEvents are **Preventable**, ie. can be canceled by calling `.preventDefault()` on a preceding TriggerEvent, and 
* some CascadeEvents are **Unstoppable**, ie. cannot be canceled by calling `.preventDefault()` on a preceding TriggerEvent.

## Demo: Preventable and Unstoppable native CascadeEvents

<code-demo src="demo/PreventableCascadingEvent.html"></code-demo>
 
## Why are some native CascadeEvents Unstoppable?

The rationale for making CascadeEvents Preventable is fairly self evident: blocking an irrelevant event before it is dispatched yield simpler code than evaluating an events relevance during its propagation (cf. Pattern StopTheUnstoppable). But, why provide this service only to a handful of native CascadeEvents? Why not provide the ability to stop all native CascadeEvents? 

> I do not know the answer to this question, so these points are only speculation.

Legacy. The architecture of native event propagation and EventCascades has been a product of gradual evolution, and not prescriptive design. Thus, many events such as `mouseup` and `click` might have been implemented at a time when `.preventDefault()` was only considered valid for blocking DefaultActions, and *not* a means to control the native EventCascade. Later, when events such as `select` and `submit` were established, the browser developers may have decided that `.preventDefault()` would also be suitable for blocking CascadeEvents, not only DefaultActions.     

Branching. Some native trigger events can spawn many different types of CascadeEvents. The `mouseup` event for example can spawn either a `contextmenu`, `click`, and `auxclick` CascadeEvent. For a developer writing an event listener for `mouseup`, which CascadeEvent a `mouseup` event will spawn might not be self evident. Thus, if a developer calls `.preventDefault()` on a `mouseup` event aiming to *only* stop a subsequent `click` CascadeEvent, he/she might also unwittingly block `auxclick` and `contextmenu` behavior. By "muting" `.preventDefault()` on `mouseup`, one might argue that the browser prevents confusions and unintended bugs.
 
Security. The browser distinguish between mouse, touch and keypress events initiated by the user (`isTrusted: true`) and identical events initiated from script (`isTrusted: false`). `isTrusted` events cannot be replicated by scripts in retrospect, and so an argument can be made that scripts should not be able to block the creation of `isTrusted: true` events. This might also explain why calling `.preventDefault()` on `mouseup` will not block an `isTrusted: true` `click` event from being triggered.

## List of native trigger => cascade event pairs

### Preventable CascadeEvents

In this list, calling `.preventDefault()` on a TriggerEvent will prevent the browser from dispatching the subsequent, native CascadeEvent.

All the native CascadeEvents here can be reproduced from script, as none can be `isTrusted: true`.

 * `click => submit`
    * the `click` event's target is an `<input type="submit">` in a `<form>`.
 * `keypress => submit`
    * `keypress` event has a key value of `enter` 
    * an `<input type="submit">` in a `<form>` has `focus`
 * `wheel => scroll`
    * `wheel` events on the `document` will trigger `scroll` events,
 * `click => select`
   * the `click` event's target is an `<option>` in a `<select>`.
   * the trigger `click` event that targets the `<option>` element will spawn a `select` event on the `<select>` element if not prevented.
 
 * todo more!! (input and form events)
 * todo more!! (HTML5 drag'n'drop?)
 * todo, add references to the spec. for each list item

### Unstoppable CascadeEvents

In this list, calling `.preventDefault()` on any of the TriggerEvents will *not* prevent the browser from dispatching the subsequent, native CascadeEvent.

 * `(mousedown + mouseup) => click`
    * primary (left) mouse button
    * target is the target of both `mousedown` and `mouseup`, or their nearest common ancestor in the DOM
 * `(mousedown + mouseup) => contextmenu`
    * secondary (right) mouse button
    * target is the target of both `mousedown` and `mouseup`, or their nearest common ancestor in the DOM
 * `(mousedown + mouseup) => auxclick`
    * any mouse button but the primary (left)
    * target is the target of both `mousedown` and `mouseup`, or their nearest common ancestor in the DOM
 * `(click + click) => dlbclick`
    * the two click happen within 300ms,
    * the target of both `click` events is the same, or their nearest common ancestor in the DOM

 * todo make a list of all Unstoppable CascadeEvents.
 * todo, does all the Unstoppable native CascadeEvents have potential to be `isTrusted`?
 
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

#### Table of CascadingEvents

 trigger event | cascade event | context premise | preventable |  
---|---|---|---
click | submit event | left button on input type="submit" in a form | yes | formElement.dispatchEvent(new SubmitEvent());??