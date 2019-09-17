# Pattern: FeedbackElement

The FeedbackElement displays a feedback image during the lifecycle of an EventSequence. The feedback image is an `HTMLElement`, often a custom element/web component. The feedback image is displayed using the BlindManDOM pattern, and removed from the DOM once the cycle of the EventSequence concludes. 

The layout and positioning of the FeedbackElement is not associated with the DOM, but pointer position and the screen dimensions. The most common position on the screen not associated with a pointer device is the top right corner.

## When to remove the FeedbackElement?

Many EventSequences start and end so quickly that humans cannot read a feedback image if it is *only* visible during such a short lifecycle. Examples of such EventSequences are `click` and the loading of network resources. For such EventSequences the removal of the feedback image is delayed using a `setTimeout(..)`. Whenever a feedback image is still active in the DOM, any new feedback image added must be a deep clone of the original feedback element.

Delaying the removal of the FeedbackElement opens up for tackling several use-cases within the EventSequence, making them reusable across apps. Allowing the FeedbackElement to remain in the DOM until the user has had time to read it, enables the EventSequence to a.o. display the *end* state of an EventSequence, and thus answer user questions such as:
 * did the gesture succeed or fail?
 * what was the *state* of the gesture when it ended? 
 * did the app register a "very fast event" such as a `click` or loading of a network resource?

## Automated CSS properties for FeedbackElements 
 
During the lifecycle of an EventSequence, the EventSequence function will automatically control the layout and position of the FeedbackElement. The BlindManDOM *must* control the `display` and `z-index` properties. Commonly, the BlindManDOM also controls the `top`, `left`, and/or `bottom`, `right` properties. In addition, several other properties such as `width`, `height`, `transform`, `opacity`, and `animate` can also be automated on the FeedbackElement.

In preparation for later chapters, these properties are written on the `feedbackElement`'s `style` object.
   
## Demo: Naive `long-press` with a bulls-eye

In this demo, we add a bulls-eye to a naive implementation of the `long-press` event. The feedback element is a circle border that grows from where the initial `mousedown` is registered, which then gets doubled as the time requirement for the press is met.

The feedback element is made up of two HTML elements: a `<style>` and a `<div>`. The feedback element uses CSS animation to visualize the time that passes during the press, and adds a second ring as the duration criterion of the `long-press` event is fulfilled. The `long-press` event also adds a check to see if the pointer has moved outside the border when it is let go. This enables the user to see the `long-press` event is activated, and then decide whether to do or cancel the event.

```html
<script >
(function () {
  
  class PondRing extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
@keyframes pond-ring {
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
:host {
  box-sizing: border-box;
  width: 10px; 
  height: 10px; 
  margin: -7px 0 0 -7px;
  border-radius: 50%; 
  animation: pond-ring 300ms forwards;
}
</style>`;
    }
  }
  customElements.define("long-press-pond-ring", PondRing);
  
  function blindManDOM(el){
    el.style.position="fixed";
    el.style.zIndex= 2147483647;
    el.style.pointerEvents= "none";
  }
  
  function addVisualFeedback(x, y){
    feedbackElement.style.left = x + "px";
    feedbackElement.style.top = y + "px";
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
  var feedbackElement = document.createElement("long-press-pond-ring");
  blindManDOM(feedbackElement);

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
</script>
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

