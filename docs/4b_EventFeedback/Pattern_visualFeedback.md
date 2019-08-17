# Pattern: VisualFeedback

VisualFeedback is a pattern for adding a visual response to a gesture. VisualFeedback works by adding and updating a set of HTML elements (feedback element) to the DOM when the gesture is active that illustrate its state.

## HowTo: add visual feedback in an unknown DOM?

The composed event implementation behind the gesture does not know anything about the state of the DOM, except that it exists. Therefore, the VisualFeedback pattern must ensure that the feedback element is visible and behaves the same in all situations:
 
1. The feedback element is appended at the end of the `body` element in the main `document`. The feedback element  is added when the gesture is activated (or surpasses a particular threshold); it can be updated and mutated during the active gesture if need be; and it is removed when the gesture is completed or ends.
 
2. The feedback element is given `position: fixed` with a set of coordinates and dimensions relevant for the gesture. This ensures that the positioning of the feedback element can be adjusted to the state data (including the HTML `target` element), and is not subject to any other style in the DOM context.
 
3. The feedback element is given the `z-index: 2147483647` value. This is the maximum integer value on 32 bit systems (tested Chrome 77), and this `z-index` combined with the feedback elements position as last on the main `document` should ensure that the feedback element is displayed in all situations.
 
4. The feedback element is explicitly marked `pointer-events: none` to prevent it from interfering with user input. The feedback element is not intended for user interaction, only as a visual que to users.

## Demo: Naive `long-press` with a bulls-eye

In this demo, we add a bulls-eye to a naive implementation of the `long-press` event described in the ListenUp chapter. The feedback element is a circle border that grows from where the initial `mousedown` is registered, which then gets doubled as the time requirement for the press is met.

The feedback element is made up of two HTML elements: a `<style>` and a `<div>`. The feedback element uses CSS animation to visualize the time that passes during the press, and adds a second ring as the duration criterion of the `long-press` event is fulfilled. The `long-press` event also adds a check to see if the pointer has moved outside the border when it is let go. This enables the user to see the `long-press` event activting, and then decide whether to do or cancel the event.

```javascript
(function () {
  const feedbackStyle = document.createElement("style");
  feedbackStyle.innerText = `
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
}`;
  const feedbackElement = document.createElement("div");
  feedbackElement.classList.add("long-press-feedback-ring");
  
  function addVisualFeedback(x, y){
    feedbackElement.style.left = x + "px";
    feedbackElement.style.top = y + "px";
    document.body.appendChild(feedbackStyle);    
    document.body.appendChild(feedbackElement);    
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
    window.addEventListener("mouseup", onMouseup);
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
    window.removeEventListener("mouseup", onMouseup);
    feedbackElement.remove();
    feedbackStyle.remove();
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

