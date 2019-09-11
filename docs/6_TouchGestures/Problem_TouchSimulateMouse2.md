# Problem: TouchDefaultAction

## Why touch simulate mouse?

In the beginning there was only desktop. And web pages made for desktop. With mouse only event listeners. Then came the smartphones. With no mouse. Only touch.

To make the old web pages with mouse event listeners work on smartphones that only had touch events, the first mobile browsers did a trick. Instead of adding an extra USB mouse to every smartphone, their browsers instead made every touch events echo mouse events. For example, a `touchstart` also dispatched a `mousedown`, a `touchmove` dispatched a `mousemove`, etc. And presto, the old, mouse-only web pages worked on the new touch-only smartphones.

This touch-echo-mouse-trick worked. But not perfectly, becuase there are both subtle and not so subtle differences with touch and mouse the mobile browsers couldn't simply echo. For example:
  * How do you `hover` with touch?
  * How can you rotate a single laser mouse position around its z-axis? 
  * How can you distinguish between a left and right mouse button using only a single finger?
  * How can you simulate multiple fingertips with a single mouse? 

The touch-echo-mouse-trick therefore only got the mobile browsers parts of the way, and they had to add other, new conventions for touch on top of the touch-echo-mouse-events.

## Why are there so many default actions for touch?

The keyboard on a smartphone is not as good as desktop keyboards, and to show the keyboard will hide up to half the screen. Smartphones therefore try to avoid using the keyboard as input device whenever they can. They only really have *one* input device: finger touch. And in the beginning, when users and developers were unaccustomed to touch, only *one* finger. That meant that *all* actions to control the browser had to be executed with a single finger. And that meant that lots mouse and keyboard based conventions for UI needed to be remediated as touch gestures:
 
 * Scrolling using the mouse `wheel` (or `pageDown` key) became drag-with-one-finger-to-scroll.
 * Zoom using `ctrl`, `+`, and `-` keys (or `ctrl`+`wheel`) became double-tap-to-zoom.
 * Double-tap-to-zoom conflicted with the existing `click`/tap gesture, and as familiarity with touch and multifinger gestures is growing is being replaced by pinch-to-zoom. 
 * Right click with the mouse became long-press-context-menu.
 * Double-click to select text became long-press-text-selection, basically because touch cannot distinguish hovering from dragging.
 
**One touch gestures have to do everything.**

The result is that the single touch gesture is packed full of alternative, slightly overlapping functions. And to accomplish all their different tasks, touch events **spawn a myriad of a) extra events and b) `defaultAction()`s**. 

To separate one action from another, the touch events must gauge their context: they vary with both **DOM context** and **EventSequence context**. For example, if the DOM element being pressed has text that can be selected, then the user will select text and a `selectstart` event is produced, otherwise the browser can interpret the long-press as a context menu request. Another example is how triggering one event sequence blocks an action: if the user first scrolls, then no long-press (and subsequent text-selection nor context menu) can be triggered during the same `touchstart` to `touchend` EventSequence.

## Browser war XLII

In their beginning, touch events therefore faced both **a very complex legacy environment of mouse only web pages** and **very complex use case of lots of overlapping touch-control-browser gestures**. The only complexity we are missing is, yes you guessed it, a browser war.

First, the early implementations of smartphones were under extreme pressure. First of all, it was bleeding edge technology from top to bottom. And the competition was fierce, everybody was trying to outrun everybody else. And that made the early implementations cut corners and design errors. 

A prime example of such an early mistake is the double-tap-to-zoom. If a user taps on a link, the browser had to wait 300ms to see if the user just started a double-tap or actually clicked on the link. There was no way around it. But, once implemented in a browser, the gesture got sticky: users got used to it; developers tailored their web apps to it; and that forced other browsers to follow suit. It is hard to uncook the techno-cultural spaghetti that is double-tap-to-zoom.

Second, the myriad of extra touch events and default actions were implemented differently by different browser vendors and versions. The sequence of events is (unfortunately) still an area in which browsers greatly differ and the standards (therefore) gives the browsers choice. And, because the extra mouse events are outside of the spec and only a temporary meassure to make old, mouse-only web pages work on mobile, the browsers implement them more as *hacks that work in practice*, not *rational principles*. 

For example, if you in Chrome on Android do a long-press on something, you will receive the following three events: `touchstart`, `mousemove`, `contextmenu`. This completely impossible to predict: 
 * there is no `mousedown` for the `touchstart` event; 
 * there is a `mousemove` event even when the user doesn't move his finger and there is no `touchmove` event; and 
 * as the context menu interrupts the touch event sequence, there is no `touchend` nor `touchcancel` event that corresponds and closes the `touchstart` event.

For more information about the chaos that is touch-echo-mouse events and touch-gesture-to-default-action, see Patrick Lauke.

## Overview: Which event devils in which details?

To manage this super-complex reality, we need an overview. And the best overview is to list which native events and actions touch gestures spawn. When the user touches the screen, the following native events can be produced: 

1. `touchstart`, `touchmove`, `touchend`, and `touchcancel`. These events are *always* produced. Obviously. But, there is **not** always be a `touchend` or `touchcancel` for all `touchstart` events. A native touch sequence can also be concluded by a `selectstart` or `contextmenu` event.

2. `mousedown`, `mousemove`, `mouseup`. The mouse events are primarily meant as communication between "new touch devices" to "old mouse-only web pages". If you are making a "new web app" or a framework for such new apps, you want your new scripts to either:
   1. relate to higher level events such as `click`, `scroll`, `pointerdown` or
   2. manage touch and mouse events separately.
   
   Mouse events are mainly crutches to support web apps produced *before* touch events even existed. New apps can listen directly for touch events when they need to, and new apps can therefore *in theory* ignore mouse events produced by touch events.
   
   Browsers provide no means to prevent touch events from echoing mouse events exclusively. This is a pity. And a fair bit surprising, as new web sites could easily add for example a `<meta touch-events="no-mouse">` or something similar to let the browser know that the app can handle touch events directly. Instead, to block touch-echo-mouse events, the developer must call `.preventDefault()` in the `touchstart` event.

3. `click`. `click` is a composed event that can be produced by both `mousedown`+`mouseup` and `touchstart`+`touchend` events. This is true both from the user's perspective and as a sequence of JS events. 

   The main difference between a mouse and touch `click` is cancellation. A mouse `click` cannot be cancelled using `.preventDefault()`, on neither `mousedown` nor `mouseup` (cf. CancelClick and ClickConflict). Touch `click` *can* be cancelled using `.preventDefault()` from `touchstart`, `touchmove`, and `touchend` events. But. Not always. The browser *can* also produce touch event that cannot be cancelled a) when there are no `passive: false` event listeners and b) it chooses to do so.
   
   Note: CSS `touch-action` property does not enable `click` events to be cancelled. ((todo Max, verify this claim.))
 
4. `selectstart`. In Chrome on Android, a long-press on a text element will a) trigger the native `selectstart` event and b) subsequent text selection default action. Text selection can be prevented in two ways:
    
    1. If `preventDefault()` is called on the `selectstart` event, then text selection default action will not be started, the ongoing native touch event sequence will neither abort nor show any sign of text selection. 
    
       If however text selection proceeds, then the following weird sequence of events are produced: `touchstart`, `mousemove`, `selectstart`. In Chrome on Android.
       
     2. Setting `user-select: none` on the element (or all elements via `window` or `document`) will prevent the native touch EventSequence from flipping into text selection mode. This method is preferable as it will also not produce the irrational `mousemove` event. ((todo Max, verify this claim.))
 
5. `contextmenu`. In Chrome on Android, a long-press on non-text elements can open the context menu. This behaves in the same way as long-press-to-select-text described above, except that it can only be blocked using `.preventDefault()`. ((todo Max, verify this claim.))

6. Scrolling (`pan`), pinch-to-zoom, double-tap-to-zoom. These "normal" default actions of touch events.
 
 To cancel scrolling and double-tap-to-zoom can be done in two ways:
   
   1. If you have access to the DOM/CSSOM, you can specify which elements will have which default actions using `touch-action`. But. The `touch-action` CSS property is read only once per touch gesture *before* the `touchstart` event is dispatched (at the same time as `pointer-events: none` would need to be read). This means that for EventSequences that does not know the DOM, setting `touch-action: none` in a `touchstart` event listener will have no effect until the next native touch EventSequence is started. (Thus, the `touch-action` CSS property only has value for composed events as part of an advanced localize strategy for touch composed events).
   
   2. To cancel scrolling, double-tap-to-zoom, and pinch-to-zoom when you can't control the DOM needs to be done using PassiveAggressiveTouchstart.
   
## Strategy 1: `.preventDefault()`

To capture the touch events and remove all the myriad of touch based gestures is the best approach. You do that by calling `.preventDefault()` in the PassiveAggressive `touchstart` event listener in your composed EventSequence. This approach works best when you don't want any scrolling, zooming, or text selection functionality from your EventSequence.

But, you from your EventSequence, you can still easily produce and dispatch `contextmenu` and 

## Strategy 2: No `.preventDefault()`

Scrolling and zooming are two actions that you don't want to replicate from JS. You can, of course, set up your own scrolling and zooming functions, but this is a) complex and tedious and b) computationally heavy, and so your result is likely to be both buggy and laggy if you try.

Thus, if you wish to let the native scrolling and zooming behavior of touch events remain in your touch EventSequence, then you want to call "no `.preventDefault()`" on your touch events. You can still easily cancel both `selectstart` and `contextmenu` by adding event listeners for them on the `window` that call `preventDefault()` and `.stopPropagation()` on them. If you don't have any other capture phase event listeners for `click` on the `window`, but only on `document`, then the `click` can also be interrupted in this way. Another alternative for `click` block is to call `preventDefault()` on `touchend`.


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