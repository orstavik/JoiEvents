# Problem: TouchSimulatesMouse

When using a handheld device, you have no mouse to control the browser, only your finger.
However, many web sites are made for desktop browsers and mouse. 
This was especially true when the mobile browser was in minority. 
So, the mobile browsers needed the finger to be able to not only trigger touch events, 
but also mouse events, in order for the mobile users to control mouse-only web sites.
To implement this, mobile browsers made the touch actions trigger *both touch and mouse events*.
 
## Problem: `touchstart` also trigger `mousedown`

In mobile browsers such as Chrome on android, when you touch an element on the screen with your finger,
this action will trigger first a `touchstart` event and then a `mousedown` event.
This applies similarly to `touchend` and `mouseup`.

```html
<div>Touch me, please!</div>

<script>
  var div = document.querySelector("div");
  div.addEventListener("touchstart", function(e){
    e.target.innerText += "touchstart,";
  });
  div.addEventListener("mousedown", function(e){
    e.target.innerText += "mousedown,";
  });
</script>
```

## Pattern: TouchstartStopMousedown

Often, the same event handlers need to react to both touch on mobile and mouse on desktop similarly, 
but not identically.
In such instances, the same event handler needs to listen for both `touchstart` and `mousedown` 
to initiate its action.

However, a user's touch on a handheld device triggers both a `touchstart` and `mousedown` event.
This is redundant and likely to cause a conflict in the response.
To avoid such conflicts, only one of the events should cause a reaction.
And since touch might need to be handled differently than mouse on a mobile, 
the touch events are to be processed and the mouse events are to be ignored.

Luckily, the added `mousedown` event triggered as a response to a touch always
come *after* the `touchstart` event on mobile browsers. (todo find reference for this).
This means that if `touchstart` disables subsequent triggers on `mousedown`,
no conflicts should arise.
As browsers can listen for both mouse and touch events on the same browsers,
the `mousedown` event listener should not be removed, 
only disabled while the touch event sequence is active.

The example below illustrates how to temporarily disable mouse events when touch events are active.

```html
<div>Touch me again, please!</div>

<script>
  var touchActive = false;
  
  var div = document.querySelector("div");
  div.addEventListener("touchstart", function(e){
    touchActive = true;
    e.target.innerText += "touchstart only,";
  });
  div.addEventListener("touchend", function(e){
    if (e.touches.length === 0)
      touchActive = false;
  });
  div.addEventListener("mousedown", function(e){
    if (touchActive)
      return;
    e.target.innerText += "mousedown only,";
  });
</script>
```