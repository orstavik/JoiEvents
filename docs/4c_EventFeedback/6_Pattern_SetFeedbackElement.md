# Pattern: SetFeedbackElement

The SetFeedbackElement pattern adds/replaces a feedback image for an EventSequence or composed event. The pattern:

1. adds a `.setImage(feedbackElement, timeToLive)` on all the composed event objects dispatched from the EventSequence function. The arguments are:
   1. `feedbackElement`: an `HTMLElement` node that will be displayed. Often, this is a custom element/web component. EventSequence *does* not clone the `feedbackElement` argument.
   2. `timeToLive`: The `Number` of milliseconds that the visual `feedbackElement` will be kept alive in the DOM after the current EventSequence cycle has completed. If the `timeToLive` is so long that *two or more* `feedbackElement`s should be added to the DOM and visible *at the same time*, then the script calling `setImage(..)` should ensure that *two or more* different element objects are passed into the EventSequence. The 

2. The `.setImage(..)` function stores the `feedbackElement` as a variable in the composed event sif. The `feedbackElement` is kept for the current event cycle only, but can be overwritten by subsequent calls to `.setImage(..)`. The `feedbackElement` is displayed on screen using the BlindManDom pattern.

3. During the lifecycle of an EventSequence, the EventSequence function can add and update custom CSS variables on the `feedbackElement`'s `style` property. Examples of such CSS variables are:
   * `--mouse-client-x`, `--mouse-client-y`, 
   * `--touch-one-x`, `--touch-two-y`, 
   * `--touch-rotation-angle`, 
   * `--press-duration`,
   * etc.
   
The `timeToLive` argument is very useful. It enables the EventSequence to display the state of an EventSequence when it *ends* and show the user:
 * *when* a gesture succeeds or fails,
 * the *state* of the gesture as it succeeds or fails, 
 * the *occurence* and/or *state* of for (composed) events that starts and ends so fast that a human user will not perceive them, such as a `click`, the browser starting and ending loading a network resources, etc.
   
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

