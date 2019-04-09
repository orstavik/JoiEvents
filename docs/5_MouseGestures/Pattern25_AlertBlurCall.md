## Pattern: AlertBlurCancel

## Disruptions should cancel EventSequences

EventSequences span a little time. During this timeline, the EventSequence do not have *exclusive* 
access to the JS domain. This means that other JS actions can occur which should disrupt the 
EventSequence mid-flight.

When an EventSequence is disrupted, it must *cancel* itself:

1. EventSequences build inner (deep) state, and when it is canceled, it must reset its inner state.

2. When disrupted, then dispatch a `sequence-cancel` event.

The trick to canceling EventSequences safely, is to to identify when the EventSequence is disrupted.
The bug with EventSequences is that they "carry on regardless" when they "should have stopped and
cancelled". An EventSequence must therefore actively listen for disruptions.

## `blur` event disruptions

Scripts such as `alert(...)` and `confirm(...)` disrupts the browser's focus and event system.
Other browser events that also disrupt the focus of the browser is to press the keys `Ctrl+l` and `F12` 
to go to the addressbar or open dev tools. Such events break the currently flow of control and should 
cancel most EventSequences.

Common for these events is that they all dispatch a `blur` event on the `window` element. 
Thus, if an EventSequence adds such an event listener *only while* it is active, it can catch all these
interruptions and cancel itself appropriately with minimal interference with other functionality.
To do so, we call the AlertBlurCancel pattern.

## Example: `long-press` with AlertBlurCancel

Below is a `long-press` event with AlertBlurCancel.

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
  window.addEventListener("blur", onBlur, true);                      
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  window.removeEventListener("blur", onBlur, true);                   
}

function onMousedown(e){                                        
  if (e.button === 0)                                                 
    startSequenceState(e);                                             
}

function onBlur(e){                                                   
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

window.addEventListener("mousedown", onMousedown);              
```

## Demo: `long-press` with AlertBlurCancel

```html
<div id="one">
  Press me more than 300ms for a long-press.
</div>
<div id="two">
  Press me more than 300ms for a long-press.
  When you try to press me, I will trigger an alert after 600ms.
  This will cause the long-press to be cancelled if you hold it down for more
  than 600ms.
</div>

<script>
document.querySelector("#two").addEventListener("mousedown", function(){
  setTimeout(function(){
    alert("MouseJailbreak! Stay on the alert!");
  }, 600);
});

window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
window.addEventListener("long-press-cancel", function(e){
  console.log("long-press-cancel", e);
});
</script>
```

## Todo

 * here we need to test different browsers.
 * should we use `document.children[0]` or `window`?

## References

 * 
