# WhatIs: DefaultAction

The `defaultAction` is a task performed by the browser. And `defaultAction`s are queued in the "event loop", the same task queue as cascading events. And defaultActions are preceded by an event, that can turn it off by calling `.preventDefault()` (in most cases).

## BrowserActions 

Tasks most commonly associated with defaultActions are system calls that direct the underlying browser app. Examples of such tasks are:
 * (click-link-to-)navigate, 
 * (wheel-to-scrollevent-that-eventually-will-)scroll, 
 * (pull-to-)refresh, 
 * (right-click-)contextmenu,
 * todo more??

BrowserActions work *outside the DOM*. They do not interact with the app. And they are universal, they will invoke the same response on any web page. BrowserActions are always **preceded by a native trigger event** and **preventable** (ie. if you call `preventDefault()` on the preceding trigger event, the browser will not perform the action). (todo verify that no BrowserActions run without a preceding trigger event)

### Reproducable and irreplicable BrowserActions

Some DefaultActions can be simulated from JS. For example, you can simulate a the defaultAction of a `click` on a link by instead giving the `location.href` property a new link. We can call such defaultActions **reproducable**.

Other DefaultActions are impossible to invoke from JS scripts. For example, it is impossible to show the context menu from JS. The browser will *only* display the regular, default context menu when the user initiates the request via a right-click, an touch-long-press, or another `isTrusted` user input event. We call such defaultActions **irreplicable**.

## Preventable CascadingEvents
 
Instead of associating a BrowserAction as the defaultAction of a native event, the browser can dispatch another CascadingEvent once the native trigger event has completed its propagation. Examples are:
   * a `click` on an `<input type="submit">` in a `<form>` spawns a `submit` CascadingEvent that are dispatched on the `<form>` element,
   * `wheel` events on the `document` will trigger `scroll` events,
   * `click` events on the `<option>` in a select will spawn a `select` event on the `<select>` element,
   * todo more!! (input and form events)

These native CascadeEvents work *inside the DOM*. They interact with the app. And they do not necessarily invoke the same response even within the same web page. We call these native CascadingEvents **preventable** because calling `.preventDefault()` on their trigger event will stop them from propagating, just like the BrowserActions.

<code-demo src="demo/PreventableCascadingEvent.html"></code-demo>

## Unstoppable CascadingEvents

There are however some native CascadingEvents that are **unstoppable**. Unstoppable CascadingEvents are queued like a defaultAction, and spawned by a trigger event. They walk like duck events, and talk like duck events. The only difference is that you cannot stop them by calling `preventDefault()` on the trigger event.

Examples of native UnstoppableCascadingEvents are:
 *  `mouseup` or `touchend` event *must* trigger `click` and `contextmenu` events. Calling `.preventDefault()` on `mouseup` or `touchend` will *not* stop the `click` event from being triggered.
 *  todo make a list of all Unstoppable CascadingEvents.
 
A likely rational for making some CascadingEvents Unstoppable is that the developer cannot remake them from script. For example, user input event such as `click` might need to be marked as `isTrusted` to enable the browser to identify if the browser should or should not allow the event to trigger a BrowserAction of some kind. As these other events would be hard to resurrect if needed later, the browser does not enable the trigger event to cancel them.

Thus, the rule of thumb is: If the cascading event can be `isTrusted`, you cannot `preventDefault()` it.
Todo. Verify this hypothesis??

## `.preventDefault()`

When you call `.preventDefault()` on a trigger event, you will cancel the DefaultAction or Preventable CascadeEvent scheduled to run immediately *after* the triggering event. `.preventDefault()` should really be called `.stopEventCascade()`.

Thus, the principal difference between `stopPropagation()` and `preventDefault()` is that:
 1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of event cascade, and 
 2. `preventDefault()` halts the outer cycle of event cascade, while not affecting the current, ongoing inner cycle of event propagation.

Sometimes, `.preventDefault()` doesn't work. You can't prevent `click` events from `mouseup`. This is mainly due to legacy functionality. In such instances, see the pattern StopTheUnstoppable.  

## References

 * 
  
 ## Todo Research the Preventable/unstoppable nature of scroll events.

However, the default action of browsers is often associated with their own specialized event. Before the browser actually will scroll, it will dispatch a native, composed `scroll` event *after* the `touchmove` event and *before* the task of actually scrolling the viewport. The event order is touchmove (event) -> scroll (event) -> scroll (task). To call `preventDefault()` on the `scroll` event will cancel the scroll task. To call `preventDefault()` on the `touchmove` event will cancel the `scroll` event which in turn will cancel the scroll task.
 
