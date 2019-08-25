# Problem: TouchSimulatesMouse

When using a handheld device, you have no mouse to control the browser, only your finger.
However, many web sites are made for desktop browsers and mouse. 
This was especially true when the mobile browser was in minority. 
So, the mobile browsers needed the finger to be able to not only trigger touch events, 
but also some key mouse events, in order for the mobile users to control mouse-only web sites.
To implement this, mobile browsers made some touch actions also trigger some mouse events.

I am not exactly sure which mouse events the browser adds to touch events. 
Both Chrome and Firefox mobile adds extra mouse events when the touch produces a click, but otherwise
no. If you have some documentation about this, please let me know.
 
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