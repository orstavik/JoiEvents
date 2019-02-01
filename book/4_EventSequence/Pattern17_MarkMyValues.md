# Pattern: MarkMyValues

Facts:
1. In the ReplaceDefaultAction and AfterthoughtEvent patterns, 
   the dispatch of the composed event is delayed asynchronously using `setTimeout(...)`. 
2. Some browsers, such as Chrome, delete (garbage collect) underlying data of native event objects. 
   For example, the `x` and `y` properties of mouse events might no longer be available 
   from the `mouse` DOM Event object when they are called for async, later.

This means that you often must store the specific values you need from the trigger events,
and not simply the DOM Event object. **MarkMyValues is a pattern of storing relevant trigger event 
values, not only the trigger event objects**. Exceptions are `timeStamp`, `target` and `type` 
properties of DOM Events, they will always be available in the trigger DOM Event object.

When storing these values, a good strategy is to create separate arrays for each value.
This gives more variables for the state, but an efficient structure.
Using separate arrays to store state like this is not generally recommended as it can quickly
lead to discrepancies between the sequence and order between the arrays,
but as the state structure of event trigger functions should be so narrow to begin with
(used in such few places), this practice can often be afforded.

## Example: `triple-click`

In this example we extend the `tripple-click` event to take note of the distance between clicks. 
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
  var tripleClickSequence = [];
  var tripleClickX = [];
  var tripleClickY = [];

  function updateSequence(e) {
    tripleClickSequence.push(e);
    tripleClickX.push(e.x);
    tripleClickY.push(e.y);
    if (tripleClickSequence.length < 3)
      return;
    if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600) {
      var result
      if (Math.abs(tripleClickX[2]-tripleClickX[0]) + Math.abs(tripleClickY[2]-tripleClickY[0]) < 20){
        result = {
          timeStamps: tripleClickSequence.map(function (e) {
            return e.timeStamp;
          }),
          xs: tripleClickX.clone(),
          ys: tripleClickY.clone()
      }
      tripleClickSequence = [];
      tripleClickX = [];
      tripleClickY = [];
      return result;
    }
    tripleClickSequence.shift();
    tripleClickX.shift();
    tripleClickY.shift();
  }

  function onClick(e) {
    var tripple = updateSequence(e);
    if (!tripple)
      return;
    dispatchPriorEvent(e.target, new CustomEvent("tripple-click", {bubbles: true, composed: true, detail: tripple}), e);
  }

  window.addEventListener("click", onClick, true);
})();
```

Put together in a demo, it looks like this:

```html
<script>
function dispatchPriorEvent(target, composedEvent, trigger) {   
  composedEvent.preventDefault = function () {                  
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              
  target.dispatchEvent(composedEvent);                   
}

//event state
var tripleClickSequence = [];
function updateSequence(e) {
  tripleClickSequence.push(e);
  if (tripleClickSequence.length < 3)
    return;
  if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600){
    var result = tripleClickSequence.map(function(e){return e.timeStamp});
    tripleClickSequence = [];
    return result;
  }
  tripleClickSequence.shift();
}


window.addEventListener(
  "click", 
  function(e) {
    var tripple = updateSequence(e);
    if (!tripple)
      return;
    dispatchPriorEvent(e.target, new CustomEvent("tripple-click", {bubbles: true, composed: true, detail: tripple}), e);
  }, 
  true
);
</script>

<div id="one">single click me</div>
<div id="two">double click me</div>
<div id="three">tripple click me</div>
<div id="trouble">single, double and tripple click me</div>

<script>
document.querySelector("#one").addEventListener("click", function(e){
  e.target.style.background = "red";
});
document.querySelector("#two").addEventListener("dblclick", function(e){
  e.target.style.background = "orange";
});
document.querySelector("#three").addEventListener("tripple-click", function(e){
  e.target.style.background = "green";
});
document.querySelector("#trouble").addEventListener("click", function(e){
  e.target.style.background = "red";
});
document.querySelector("#trouble").addEventListener("dblclick", function(e){
  e.target.style.background = "orange";
});
document.querySelector("#trouble").addEventListener("tripple-click", function(e){
  e.target.style.background = "green";
});
</script>
```
## References

 * 
