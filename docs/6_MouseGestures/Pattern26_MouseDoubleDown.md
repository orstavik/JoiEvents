# Pattern: MouseDoubleDown

## Problem: Accidental extra mouse button press

What happens if the user either intentionally or by accident presses 
a second mouse button during an ongoing mouse-based gesture?

Most commonly mouse-based gestures use only one mouse button. If, an extra `mousedown` event is 
dispatched during such a single mouse-based EventSequence, the EventSequence can either:
1. disregard the extra mousebutton and carry on, or
2. cancel itself.

But, some creative mouse-based gestures might rely on a combination of mouse buttons being pressed,
sometimes even in a particular order. Such events might require sophisticated logic in their
initial and secondary trigger functions.

The problem for all these methods is that processing and handling the `mousedown` event grows in 
complexity: the `mousedown` event listener might not only start/initiate the EventSequence, but also
stop and cancel it.

## How best to manage `mousedown`?

Even mouse-based gestures that rely on only a single mouse button needs to listen for secondary
`mousedown` events and react differently. And the more complex either the `mousedown` initiation 
or `mousedown` cancel sequences are, the more the developer can benefit from splitting the functionality
in a clear divide. And the best way to do so, is to *replace*:
1. the *initial* event trigger function for `mousedown` with
2. a *secondary* event trigger function for `mousedown`
3. *while* the EventSequence is active.

To switch between initial and secondary event trigger function for `mousedown` in this way we call
MouseDoubleDown.

## Example: `long-press` with MouseDoubleDown

To illustrate how an EventSequence works with MouseDoubleDown, we add it to our `long-press` gesture.

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

var primaryEvent;                                               

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true);             
  window.addEventListener("mousedown", onMousedownSecondary, true);   //replace the initial trigger
  window.removeEventListener("mousedown", onMousedownInitial, true);  //with the secondary trigger
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  window.removeEventListener("mousedown", onMousedownSecondary, true);//replace the secondary trigger
  window.addEventListener("mousedown", onMousedownInitial, true);     //with the initial trigger
}

function onMousedownInitial(e){                                       //initial trigger 
  if (e.button === 0)                                                 
    startSequenceState(e);                                             
}

function onMousedownSecondary(e){                                     //secondary trigger         
  dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                       
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedownInitial);              
```

## Demo: `long-press` in jail
```html
<div id="one">
  Press me more than 300ms for a long-press.
  If you hit an extra mouse button while you press,
  the long-press will be canceled.
</div>

<script>

window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
window.addEventListener("long-press-cancel", function(e){
  console.log("long-press-cancel", e);
});
</script>
```

## References

 * 
