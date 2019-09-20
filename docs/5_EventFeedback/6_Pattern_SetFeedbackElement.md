# Pattern: SetFeedbackElement

The SetFeedbackElement pattern adds/replaces a feedback image for an EventSequence or composed event. The pattern:

1. adds a `.setImage(feedbackElement, timeToLive)` on all the composed event objects dispatched from the EventSequence function. The arguments are:
   1. `feedbackElement`: an `HTMLElement` node that will be displayed. Often, this is a custom element/web component.
   2. `ttl` (time to live): The `Number` of milliseconds that the visual `feedbackElement` will be kept alive in the DOM after the current EventSequence cycle has completed.
   * If the `feedbackElement` argument `isConnected` to the DOM when it is to be first added, the EventSequence will deep clone the `feedbackElement` object.

2. The `.setImage(..)` function overrides the `feedbackElement` for one display cycle. If the EventSequence needs to override the default display of the `feedbackElement`, then a static `setDefaultImage(..)` function needs to be set up on the ExtendsEvent class.

3. The EventSequence will attach the `feedbackElement` to a BlindManDom layer element and automatically control relevant CSS variables on the BlindManDom layer such as position, size and rotation.

4. The EventSequence will attach CSS pseudo-pseudo-classes to the feedback element, as it would its default FeedbackElement.
   
## Demo: Show how `long-press` persists

In this demo, we set up a `long-press` EventSequence and pass it two custom feedback elements using the `.setImage(...)` method on the `long-press-start` event. The first `setImage(...)` is passed a plain old `<div>` element. The `<div>` is dumb as in restricted from doing any animations or adaptations to CSS pseudo-pseudo-classes. The second `setImage(...)` is passed a modern, elegant web component called `<beating-heart>`. The web component is smart as it can include styles that both animate and respond to changing pseudo-pseudo-classes.

To reduce the example size, we do not implement a default `long-press` FeedbackElement such as a bulls-eye. The feedback element is a circle border that grows from where the initial `mousedown` is registered, which then gets doubled as the time requirement for the press is met.

```html
<script>
  (function () {

    class BlindManDomLayer extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
<style>
  @keyframes starting-press {
    0% {
      transform: scale(0);
      opacity: 0.2;
    }
    100% {
      transform: scale(1);
      opacity: 1.0;
    }
  }
  :host {
    margin: 0;
    padding: 0;
    position: fixed;
    z-index: 2147483647;
    pointer-events: none;
    /*overflow: visible;*/
    animation: starting-press 600ms forwards;
  }
</style>
<slot></slot>`;
      }
    }

    customElements.define("blind-man-dom-layer", BlindManDomLayer);

    var blindMan = document.createElement("blind-man-dom-layer");
    var feedbackElement;
    var timeToLive;
    var primaryEvent;

    class LongPressEvent extends Event {
      constructor(type, props = {bubbles: true, composed: true}) {
        super(type, props);
      }

      setImage(el, ttl) {
        feedbackElement = el;
        timeToLive = ttl;
      }
    }

    function dispatchPriorEvent(target, composedEvent, trigger) {
      composedEvent.preventDefault = function () {
        trigger.preventDefault();
        trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
      };
      composedEvent.trigger = trigger;
      return target.dispatchEvent(composedEvent);
    }

    function addVisualFeedback(x, y) {
      //using left and top instead of transform: translate(x, y) so as to simplify scale animation
      if (blindMan.isConnected){
        blindMan = blindMan.cloneNode();
        feedbackElement = feedbackElement.cloneNode();
      }
      blindMan.style.left = x + "px";
      blindMan.style.top = y + "px";
      blindMan.appendChild(feedbackElement);
      document.body.appendChild(blindMan);
    }

    function removeVisualFeedback(endState, ttl) {
      blindMan.classList.add(endState);
      feedbackElement.classList.add(endState);
      var a = blindMan;
      var b = feedbackElement;
      setTimeout(function () {
        b.classList.remove(endState);
        b.remove();
        a.classList.remove(endState);
        a.remove();
      }, ttl);
    }

    function onMousedown(e) {
      if (e.button !== 0)
        return;
      primaryEvent = e;
      window.addEventListener("mouseup", onMouseup, true);
      const longPress = new LongPressEvent("long-press-start");
      dispatchPriorEvent(e.target, longPress, e);
      //the event must be dispatched *before* the addVisualFeedback is run.
      addVisualFeedback(e.clientX, e.clientY);
    }

    function onMouseup(e) {
      var duration = e.timeStamp - primaryEvent.timeStamp;
      const endState = duration > 600 ? "long-press" : "long-press-cancel";
      const longPress = new LongPressEvent(endState);
      dispatchPriorEvent(e.target, longPress, e);
      const delay = timeToLive !== undefined ? timeToLive : 250;
      removeVisualFeedback("long-press", delay);
      primaryEvent = undefined;
      window.removeEventListener("mouseup", onMouseup, true);
    }

    window.addEventListener("mousedown", onMousedown, true);
  })();
</script>
<h1>Election 2020: Long-press to select!</h1>
<h3 id="theDonald">Trump</h3>
<h3 id="Pocahuntas">Warren</h3>

<script>
  const blackHole = document.createElement("div");
  blackHole.style.width = "20px";
  blackHole.style.height = "20px";
  blackHole.style.background = "black";
  blackHole.style.borderRadius = "50%";
  blackHole.style.margin = "-10px 0 0 -10px";

  class BeatingHeart extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
  @keyframes throb {
    0% {
      -webkit-text-stroke: 1px red;
    }
    100% {
      -webkit-text-stroke: 3px darkred;
    }
  }
  :host {
    margin: -10px 0 0 -10px;
    box-sizing: border-box;
    width: 20px;
    height: 20px;
    -webkit-text-stroke: 3px red;
  }
  :host(*.long-press) {
    animation: throb 400ms infinite alternate forwards;
    color: red;
    /*box-sizing: border-box;*/
  }
</style>&#9829`;
    }
  }
  customElements.define("beating-heart", BeatingHeart);
  const persistance = new BeatingHeart();

document.querySelector("#theDonald").addEventListener("long-press-start", function(e){
  e.setImage(blackHole);
});
document.querySelector("#Pocahuntas").addEventListener("long-press-start", function(e){
  e.setImage(persistance, 2147483647);
});
window.addEventListener("long-press-start", e => console.log(e.type));
window.addEventListener("long-press", e => console.log(e.type));
</script>
``` 

## References

 * []()

