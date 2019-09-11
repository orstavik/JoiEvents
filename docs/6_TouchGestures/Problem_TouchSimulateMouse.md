# Problem: TouchSimulatesMouse

When using a handheld device, you have no mouse to control the browser, only your finger. However, many web sites are made for desktop browsers and mouse. This was especially true when the mobile browser was in minority. So, the mobile browsers needed the finger to be able to not only trigger touch events, but also some key mouse events, in order for the mobile users to control mouse-only web sites. To implement this, mobile browsers made some touch actions also trigger some mouse events.

## Which events are triggered by touch events?

There is truly a myriad of mouse events and other events triggered by touch events (see Lauke). The principle is that a physical touchstart, touchmove, touchend will produce touchstart, mousedown, touchmove, mousemove, touchend, mouseup, click events. But this is **not the reality**. If you do a touch long press on Chrome android, you get touchstart, mousemove, contextmenu(!). The TouchSimulateMouse are good IE6 style problems, with no clear agreement between browsers and no apparent logic, just different hacks from different browsers to make things work now, for me, not in the future for all.

So, how to handle these "extra" events and actions spawned by touch events? First, we need an overview of all such events and actions. Touch events can spawn:
1. dispatch mouse events (mousedown, mousemove, mouseup)
2. dispatch the click event
3. dispatch the contextmenu event (that in turn will open the context menu) (long-press on Android)
4. dispatch selectstart event and select the text (long-press in Chrome Android when you press on text)
5. execute scrolling, but touch driven scrolling will not necessarily dispatch scroll events.

In the updated spec, if you call `preventDefault()` on:
1. `touchstart`, you will block 1) mouse events, 2) click, 3) contextmenu, and 4) scrolling,
2. the first `touchmove` event, you will only block 3) scrolling, and
3. `touchend`, you will only block 2) `click`. (and also `mouseup` event??).

 * The long-press produce contextmenu, can be blocked using a temporary event listener for contextmenu that preventDefault and thus block the context menu.

 * Do not spawn mouseevents. Should you listen for them and then block them one by one? or block them all using preventDefault in touchstart?

 * To separate the click and the scrolling, simply a) block the click in touchstart, and then b) produce your own click event in 

This is browser dependent, and I am not sure how well this standard is implemented and which browser follows which convention. Also, note that the browser may set `cancelable` to `false` on the touch event if there are no listeners added with `passive: false` as their configuration, thus negating the developers ability to call `preventDefault()`.
 
## Problem: touch events spawns mouse events


//todo check and fix this
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