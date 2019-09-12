# WhatIs: Propagation

For an introduction to event propagation and bubbling, see: [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).

Almost **all events bubble**, except:
 * `window` events (`load`, `error`).
 * a few (legacy?) events. However, these non-bubbling DOM events have either been duplicated by identical events that *do* bubble or replaced by `MutationObserver`:
    * `focus`/`blur` -> `focusin`/`focusout` 
    * `mouseenter`/`mouseleave` -> `mouseover`/`mouseout`
    * `DOMNodeRemovedFromDocument`/`DOMNodeInsertedIntoDocument` -> `MutationObserver`.

## Example 1: Capture vs. Bubble phase

<code-demo src="demo/BubbleCapture.html"></code-demo>
   
In the example above, you have a small DOM with a couple of elements. 
To these elements, there are added some click listeners.
If you click on "Hello sunshine!", you will see in the log that the event listeners will be 
called in the following sequence:

1. The event is *captured*. The sequence here is top-down, from the `window` towards the `target`. 
   
2. *At the target* the event listeners are processed in the sequence they were added, 
   completely disregarding if they were marked with `capture` or not. 
   This means that when you click on "Hello sunshine!", the `"bubble"` event listener will be 
   triggered before the `"capture"` event listener. This is a problem when you need to give priority to certain event listeners in order to for example block an event (cf. the StopTheUnstoppable and EarlyBird patterns).

3. The event is *bubbles*. The sequence here is down-top, from the `target` parentNode to the `window`.

 * If two event listeners are added on the same element in the same propagation phase,
   then they will be run in the order that they were added.

## Example 2: Native composed events (touchend -> mouseup -> click)

> todo should I rename "composed events" to "DominoEvents" or "SyntheticEvents" something similar? The composed events term is already associated with shadowDOM transgression (which is off), but at the same time ComposedEvents is a good concept.

The domino-effect.

<code-demo src="demo/TouchendMouseupClick.html"></code-demo>

The browser will automatically spawn a `mousedown`/`mouseup` events from 
`touchstart`/`touchend` events on mobile to support legacy web pages that only implement support for
mouse events. These spawned `mousedown` and `mouseup` events we can say are DOM Events composed from
other `touchstart`/`touchend` DOM Events.

The `click` event is composed from a pair of preceding:
 * `touchstart`+`touchend` events, if the original action was a touch event, or
 * `mousedown`+`mouseup` events, if the original event was a mouse event.

The example above illustrate how such native composed DOM Events propagate *one-by-one*.
The native composed events does not start their own propagation before their preceding trigger events
has completed their propagation. Thus, propagation spans three levels:

1. Macro level: Event listeners for native events dispatched by the browser are *first* triggered by 
   DOM Event type. Native events propagate *one-by-one* completely, ie. 
   a native trigger event will complete its propagation before another native composed event 
   begins its propagation.
   
2. Medium level: Event listeners are then triggered depending on propagation phase and DOM tree position.
   1. capture phase (from `window` to `target.parentNode`)
   2. target phase (on `target`, `capture: true/false` ignored)
   3. bubble phase (from `target.parentNode` to `window`)

3. Micro level: Event listeners connected to the same DOM node and in the same propagation phase are 
   triggered in registration order.
   
## Example 3: Custom events (echo-click)

<code-demo src="demo/EchoClick.html"></code-demo>

When events are dispatched from JS via methods such as `.dispatchEvent(..)` or `.click()`,
then they do *not* propagate one-by-one, but propagate *nested one-inside-another*.
You see this in the example above that as soon as `.dispatchEvent(...)` for `echo-click` 
and `echo-echo-click` are called, they start to propagate down in the capture phase *before*
their trigger `click` and `echo-click` events have completed.

## Discussion: `preventDefault()`

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

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)
 * [Lauke: event sequences](https://patrickhlauke.github.io/touch/tests/results/)