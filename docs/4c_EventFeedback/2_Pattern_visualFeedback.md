# Pattern: VisualFeedback

VisualFeedback is a pattern for adding a visual response to a gesture. VisualFeedback works by adding and updating a set of HTML elements (feedback element) to the DOM when the gesture is active that illustrate its state.

## Trick: BlindManDOM

> Even when you know *nothing* about the DOM, you can still *add* to it, *temporarily*.

The composed event implementation behind the gesture does not know anything about the state of the DOM. Except that it exists. Still, the VisualFeedback pattern needs to add something to the DOM, something that is visible and behaves consistently in all situations. So, how to do that?
 
1. The DOM *always* has a main `document`, and the main `document` *always* has one `<body>` element. Thus, the feedback element can be appended this `<body>` element. The feedback element can be added when the gesture is activated (or surpasses a particular threshold in the gesture state); it can be updated and mutated during the active gesture if need be; and it can be removed when the gesture ends.
 
2. The feedback element is given `position: fixed` with a set of coordinates and dimensions relevant for the gesture. This ensures that the positioning of the feedback element can be adjusted to the state data (including the HTML `target` element), and is not influenced by the DOM context.
 
3. The feedback element is given the `z-index: 2147483647` value. 2147483647 is the maximum z-index value (please, prove me wrong! :), and this `z-index` combined with the feedback elements position as last on the main `document` ensures that the feedback element is displayed in all situations.
 
4. The feedback element has `pointer-events: none`. This makes the feedback element invisible for touch and mouse interaction. Any BlindManDOM element should do this, so the visual feedback doesn't conflict with any ongoing user interaction.

## Demo: Naive `long-press` with a bulls-eye

In this demo, we add a bulls-eye to a naive implementation of the `long-press` event. The feedback element is a circle border that grows from where the initial `mousedown` is registered, which then gets doubled as the time requirement for the press is met.

The feedback element is made up of two HTML elements: a `<style>` and a `<div>`. The feedback element uses CSS animation to visualize the time that passes during the press, and adds a second ring as the duration criterion of the `long-press` event is fulfilled. The `long-press` event also adds a check to see if the pointer has moved outside the border when it is let go. This enables the user to see the `long-press` event is activated, and then decide whether to do or cancel the event.

```javascript
(function () {
  const feedbackElement = document.createElement("span");
  feedbackElement.innerHTML = `
<style>
.long-press-feedback-ring {
  position: fixed; 
  z-index: 2147483647; 
  pointer-events: none; 
  margin: -7px 0 0 -7px;
  box-sizing: border-box;
  width: 10px; 
  height: 10px; 
  border-radius: 50%; 
  animation: long-press 300ms forwards;
}
@keyframes long-press {
  0% {
    transform: scale(0);
    border: 1px solid rgba(9, 9, 9, 0.1); 
  }
  99% {
    transform: scale(2);
    border: 1px solid rgba(9, 9, 9, 0.1); 
  }
  100% {
    transform: scale(2);
    border: 4px double rgba(9, 9, 9, 0.1);
  }
}
</style>
<div class="long-press-feedback-ring"></div>`;

  function addVisualFeedback(x, y){
    feedbackElement.children[1].style.left = x + "px";
    feedbackElement.children[1].style.top = y + "px";
    document.body.appendChild(feedbackElement);    
  }
  
  function removeVisualFeedback(){
    feedbackElement.remove();    
  }
  
  function isInside(start, stop){
    const x = stop.clientX - start.clientX;
    const y = stop.clientY - start.clientY;
    return (x * x + y * y) < 81;
  }
  
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;

  function onMousedown(e) {                                 
    if (e.button !== 0)                                     
      return;
    primaryEvent = e;                                       
    window.addEventListener("mouseup", onMouseup, true);
    addVisualFeedback(e.clientX, e.clientY);
  }

  function onMouseup(e) {                                   
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
    if (duration > 300 && isInside(primaryEvent, e)){                                    
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e); 
    }
    primaryEvent = undefined;                               
    window.removeEventListener("mouseup", onMouseup, true);
    removeVisualFeedback();
  }

  window.addEventListener("mousedown", onMousedown, true);  
})();
```
In the demo below, the long-press is logged and will cancel link clicks.
```html
<script src="demo/naive-long-press-visual.js"></script>
<a href="https://elizabethwarren.com/">Try to click me quick</a>
<hr>
<a href="https://time.com/5622374/donald-trump-climate-change-hoax-event/">The right thing to do is to press me hard and long</a>
<script >
  window.addEventListener("long-press", e => {e.preventDefault(); console.log(e)});  
</script>
``` 

## References

 * []()

