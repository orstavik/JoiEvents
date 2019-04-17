# Pattern: PriorEvent

The PriorEvent pattern propagates the custom composed event *before* the triggering event.

The obvious drawback of this pattern is that it reverses the propagation order of the triggering 
and composed event. The benefit however is that this pattern allows full control of the defaultAction
from both the composed and trigger event. Below is the custom, composed event `echo-click` 
implemented as a PriorEvent and EarlyBird patterns.

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {   //1
  composedEvent.preventDefault = function () {                  //2
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              //3
  target.dispatchEvent(composedEvent);                          //4
}

function onClick(e){
  if (e.defaultPrevented || e.customPrevented)
    return;
  dispatchPriorEvent(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
}

document.addEventListener("click", onClick, true);
```

1. To make the pattern easier to reuse, the `dispatchPriorEvent(target, composedEvent, trigger)` 
   function is split from the EarlyBird event listener.
2. The custom, composed event's `preventDefault()` is overridden with a new method that will 
   both stop both the trailing, triggering event and its `defaultAction`.
3. The `trigger` event is added as a property to the composed event, 
   so that it can be accessed if needed.
4. And the composed event is dispatched synchronously, 
   so that it will start propagating immediately and thus *precede* the triggering event.

```html
<script>
function dispatchPriorEvent(target, composedEvent, trigger) {   //1
  composedEvent.preventDefault = function () {                  //2
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              //3
  target.dispatchEvent(composedEvent);                          //4
}

function onClick(e){
  if (e.defaultPrevented || e.customPrevented)
    return;
  dispatchPriorEvent(e.target, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
}

document.addEventListener("click", onClick, true);
</script>

<p>
The demo below illustrate how the PriorEvent works. 
It uses three different event listeners on different elements to control the behavior of 
the composed and triggering event and their default actions.
</p>
<ul>
  <li>you can click me</li>
  <li><a id="a" href="https://normal.com">normal link, will navigate</a></li>
  <li><a id="b" href="https://click-prevented.com">prevented on click, will not navigate</a></li>
  <li><a id="c" href="https://echo-click-prevented.com">prevented on echo-click, will not propagate "click" nor navigate</a></li>
  <li><a id="d" href="https://echo-click-prevented-via-trigger.com">prevented on echo-click via trigger property, propagates click but will not navigate</a></li>
</ul>

<script>
window.addEventListener("click", function(e){alert("click event")});
window.addEventListener("echo-click", function(e){alert("echo-click event")});

document.querySelector("#b").addEventListener("click", e => e.preventDefault());
document.querySelector("#c").addEventListener("echo-click", e => e.preventDefault());
document.querySelector("#d").addEventListener("echo-click", e => e.trigger.preventDefault());
</script>
```

This example illustrate how a fully functional composedEvent->triggerEvent->defaultAction 
sequence can be constructed. The benefit of this pattern is all the events can control the default action,
the drawback of this pattern is that event listeners on the triggerEvent cannot be called 
upon to cancel the composedEvent.

## PriorEvent reverses event sequence

Native, composed events always propagate *after* the native triggering event:
`mouseup` then `click`; `click` then `submit`.
This order is intuitive: the trigger event *comes* before the triggered, composed event.

We would like to have the same causal sequence for custom composed events. We would like to postpone
our custom composed events so they run after their trigger event has completed their propagation,
while still employing the EarlyBird pattern so it cannot be blocked from another event listener
accidentally calling `.stopPropagation()`. In the next chapter we will look at how we can composed 
such custom events, AfterthoughtEvents, and their main, big limitation:
no control of the defaultAction from the custom composed event.

## References

 * [Default browser action](https://javascript.info/default-browser-action)