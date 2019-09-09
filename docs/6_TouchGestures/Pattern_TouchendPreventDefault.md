# Problem: TouchSimulatesMouse

When using a handheld device, you have no mouse to control the browser, only your finger. However, many web sites are made for desktop browsers and mouse. This was especially true when the mobile browser was in minority. So, the mobile browsers needed the finger to be able to not only trigger touch events, but also some key mouse events, in order for the mobile users to control mouse-only web sites. To implement this, mobile browsers made some touch actions also trigger some mouse events.

## Which events are triggered by touch events?

There is truly a myriad of mouse events and other events triggered by touch events (see Lauke). The basic principle is that a physical touchstart, touchmove, touchend will produce touchstart, mousedown, touchmove, mousemove, touchend, mouseup, click events, but this is not given, and both the sequence and event types may differ from browser to browser. These "extra" events spawned by touch events are considered part of the default actions of touch events, along side scrolling.

Put simply, the default action of touch events are:
1. mouse events,
2. click
3. scrolling

If you call `preventDefault()` on:
1. `touchstart`, you will block 1) mouse events, 2) click and 3) scrolling,
2. the first `touchmove` event, you will only block 3) scrolling, and
3. `touchend`, you will only block 2) `click`. (and also `mouseup` event??).

This is browser dependent, and I am not sure how well this standard is implemented and which browser follows which convention. Also, note that the browser may set `cancellable` to `false` on the touch event if there are no listeners added with `passive: false` as their configuration, thus negating the developers ability to call `preventDefault()`.
 
## Problem: touch events spawns mouse events

In mobile browsers, when you `click` with a finger,
this action will trigger the following sequence of events:
 * `touchstart`
 * `touchend`
 * `mousedown` (just ~300ms after the first `touchstart` event in Chrome, no 300ms delay in Firefox mobile),
 * `mouseup`
 * `click` (Chrome bug: this event is missing.)
 
<code-demo src="demo/TouchMe.html"></code-demo>

## Pattern: TouchendPreventDefault

To block all the mouse events, but not default actions such as scrolling, just call `preventDefault()` on
the `touchend` event.

> todo test how this works in all the different mobile browsers, Safari Firefox Edge

<code-demo src="demo/TouchMeAgain.html"></code-demo>

## References 

 * [Lauke: event sequences](https://patrickhlauke.github.io/touch/tests/results/)
 * [w3c: touch](https://w3c.github.io/touch-events/#touch-interface)
 * [MDN: touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)




## Todo future work

### Problem: Devices with *both* touch and mouse

To support devices with both a touch and a mouse device:
 * if an gesture supports both mouse and touch,
 * then the initial trigger function should verify that it is not already activated before triggering.
 

### Solution: ShowGesture state / grab pointer focus

Gestures would like to *capturePointer* for all pointers sometimes. If the touch is active, then
the mouse must wait too. How to do that?
 
Gestures should have a visible state. The `capturePointer` concept should maybe be a `captureInteractionFocus`
too. This is related to [Pattern23_ShowGestureState](../4b_EventFeedback/Pattern23_ShowGestureState.md)