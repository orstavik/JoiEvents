# Pattern: MarkMyValues

## Fact 1: Event data gets Garbage collected early

Some browsers, such as Chrome, delete (garbage collect) underlying data of native event objects
*before* they delete the Event object itself.
This means that some properties on an Event object might no longer be available 
if you try to read it asynchronously, such as from a `setTimeout` or rAF callback.
For example, even thought the DOM Event object of a mouse event still exists, 
its `x` and `y` properties can become undefined at a later point.
Once the setTimeout is invoked, the DOM Event object that represent the trigger event *only*
safely contains the `timeStamp` and `type`, plus the `target` if it has not been removed. 

```html
<div width="100%" height="100%">move the mouse to remove me</div>

<script>
var first = true;

window.addEventListener("mousemove", function(e){
  console.log(e.type);                 //mousemove
  console.log(e.timeStamp);            //23:59:59.31.12.1999
  console.log(e.target);               //div
  console.log(e.x);                    //42
  if (!first)                          
    e.target.remove();                 //e.target is kept the first time the mousemove event listener
  else                                 //is called, but then deleted
    first = false;                     
  setTimeout(function(){               
    console.log(e.type);               //mousemove
    console.log(e.timeStamp);          //23:59:59.31.12.1999
    console.log(e.target.typeName);    //first DIV, then undefined
    console.log(e.x);                  //undefined
  });
});
</script>
```

## HowTo: avoid loosing event data

Both the ReplaceDefaultAction and AfterthoughtEvent patterns delay
the dispatch of the composed event asynchronously using `setTimeout(...)`. 
This means that if your composed event needs to use values from the trigger event object such as
such as the `x` and `y` properties of mouse events, then these values must be stored *specifically, 
up front*.

Doing so is called **MarkMyValues**. **MarkMyValues** is the pattern of storing relevant trigger 
event values up-front. It is often not enough to simply store the DOM Event object. 
Exceptions are the `timeStamp`, `type`, and most often the `target` property.

The MarkMyValues pattern is most often used in combination with the DetailOnDemand pattern.
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
