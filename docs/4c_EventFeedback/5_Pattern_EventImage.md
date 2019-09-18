# Pattern: FeedbackElement

The FeedbackElement displays a feedback image during the lifecycle of an EventSequence. The feedback image is an `HTMLElement`, often a custom element/web component. The feedback image is displayed using the BlindManDOM pattern, and removed from the DOM once the cycle of the EventSequence concludes. 

The layout and positioning of the FeedbackElement is *not* DOM related, but pointer position and the screen dimensions. DOM related feedback is handled by CSS pseudo-classes and made visible by the script controlling the shadowDOM of an element, or script controlling the lightDOM of an app. The most common position on the screen not associated with a pointer device is the top right corner.

## When to remove the FeedbackElement?

Many EventSequences start and end so quickly that humans cannot read a feedback image if it is *only* visible during such a short lifecycle. Examples of such EventSequences are `click`, `select`, loading network resources, and more. For such EventSequences the removal of the feedback image is delayed using a `setTimeout(..)`.

Delaying the removal of the FeedbackElement using `setTimeout(...)` is a boon. When the duration of the feedback is separated from the duration of the EventSequence, the *end* state of an EventSequence can be communicated to the user. This enables the EventSequence to answer such questions as:
 * did the gesture succeed or fail?
 * what was the *state* of the gesture when it ended? 
 * did the app register a "very fast event" such as a `click` or loading of a network resource?

Not for implementations: When two or more feedback elements from the same EventSequence are active in the DOM at the same time, then remember to deep clone the feedback image or otherwise ensure that the different feedback element objects.

## Automated CSS properties for FeedbackElements 
 
The BlindManDOM *must* set `display: fixed; pointer-events: none; z-index: 2147483647;` on the FeedbackElement `style` object, and these should not be overridden by the user. To accomplish this safely, a separate BlindManDomLayer element is created inside the composed event sif function, which any outside developer must actively seek out in the DOM in order to get a hold of.

But, EventSequences often also control automatically other aspects of the layout such as:
 * `top`, `left`, `bottom`, `right`, 
 * `width`, `height`, `box-sizing`, 
 * `transform`, `opacity`, `animate`,
 * a.o.
 
These properties can also be added to the other properties such as ,  can also be automated on the FeedbackElement.

In preparation for later chapters, these properties are written on the `feedbackElement`'s `style` object.
   
## Demo: Naive `long-press` with a bulls-eye

In this demo, we add a bulls-eye to a naive implementation of the `long-press` event. The feedback element is a circle border that grows from where the initial `mousedown` is registered, which then gets doubled as the time requirement for the press is met.

The feedback element is made up of two HTML elements: a `<style>` and a `<div>`. The feedback element uses CSS animation to visualize the time that passes during the press, and adds a second ring as the duration criterion of the `long-press` event is fulfilled. The `long-press` event also adds a check to see if the pointer has moved outside the border when it is let go. This enables the user to see the `long-press` event is activated, and then decide whether to do or cancel the event.

```html
<script >
(function () {
  
  class BlindManDomLayer extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>:host { position: fixed; z-index: 2147483647; pointer-events: none; }</style>
<slot></slot>`;
    }
  }
  customElements.define("blind-man-dom-layer", BlindManDomLayer);
  
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

<h1>Hello sunshine</h1>
<script >
window.addEventListener("long-press", function(e){
  console.log(e.type);
})
</script>
``` 

## References

 * []()

