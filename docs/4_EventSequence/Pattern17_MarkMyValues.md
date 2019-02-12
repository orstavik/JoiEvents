# Pattern: MarkMyValues

Facts:

1. In the ReplaceDefaultAction and AfterthoughtEvent patterns, 
   the dispatch of the composed event is delayed asynchronously using `setTimeout(...)`. 

2. Some browsers, such as Chrome, delete (garbage collect) underlying data of native event objects. 
   For example, the `x` and `y` properties of mouse events might no longer be available 
   from the `mouse` DOM Event object when they are called for async, later.

* max: can you verify point nr 2 and check out which browsers do/do not this?

This means that you often must store the specific values you need from the trigger events,
and not simply the DOM Event object. **MarkMyValues is a pattern of storing relevant trigger event 
values, not only the trigger event objects**. Exceptions are `timeStamp`, `target` and `type` 
properties of DOM Events, they will always be available in the trigger DOM Event object.

The MarkMyValues pattern is most often used in combination with another pattern DetailOnDemand.
When used with DetailOnDemand, the values should be copied from the trigger event the composed
event in the construction of the DetailOnDemand object.

## Example: `triple-click` with little wiggle room

In this example we extend the `triple-click` event to take note of the distance between clicks. 
If the combined distance between the `x` and `y` values are above a certain threshold, 
no `triple-click` will be dispatched.

```javascript
(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    target.dispatchEvent(composedEvent);
  }

  //event state
  var clicks = [];

  function updateSequence(e) {
    var myValues = {click: e, x: e.x, y: e.y};
    clicks.push(myValues);
    if (clicks.length < 3)
      return;
    var duration = clicks[2].click.timeStamp - clicks[0].click.timeStamp;
    var wiggle = Math.abs(clicks[2].x-clicks[0].x) + Math.abs(clicks[2].y-clicks[0].y);
    if (duration <= 600 && wiggle < 20) {
      clicks = [];
      return {duration: duration, wiggle: wiggle};
    }
    clicks.shift();
  }

  function onClick(e) {
    var detail = updateSequence(e);
    if (!detail)
      return;
    new CustomEvent("triple-click", {bubbles: true, composed: true, detail: detail});
    dispatchPriorEvent(e.target, triple, e);
  }

  window.addEventListener("click", onClick, true);
})();
```

## Demo: `triple-click` with little wiggle room

```html
<script src="https://cdn.jsdelivr.net/npm/joievents@1.0.11/src/gestures/triple-click-MarkMyValues.js"></script>

<div id="one">single
  <div id="two">double
    <div id="three">tripple click me</div>
  </div>
</div>

<script>
  var one = document.querySelector("#one");
  var two = document.querySelector("#two");
  var three = document.querySelector("#three");

  one.addEventListener("click", function (e) {
    one.style.border = "3px solid red";
  });
  two.addEventListener("dblclick", function (e) {
    two.style.border = "3px solid orange";
  });
  three.addEventListener("triple-click", function (e) {
    three.style.border = "3px solid green";
  });
</script>
```
## References

 * 
