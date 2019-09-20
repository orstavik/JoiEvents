# Pattern: FeedbackElement

The FeedbackElement displays a feedback image during the lifecycle of an EventSequence. The feedback image is an `HTMLElement`, often a custom element/web component. The feedback image is displayed using the BlindManDom pattern, and removed from the DOM once the cycle of the EventSequence concludes. 

The layout and positioning of the FeedbackElement is *not exclusively* DOM related, but often is:
1. identical to a pointer position,
2. fixed to a static screen viewport (most commonly top right corner),
3. fixed to a static element viewport (such as the top right corner of an element), and
4. calculated based on both a static viewport and a relative pointer position (cf. the pull-to-refresh and over-scroll feedback images). 

DOM related feedback is handled by CSS pseudo-classes and made visible by the script controlling the shadowDOM of an element, or script controlling the lightDOM of an app. The most common position on the screen not associated with a pointer device is the top right corner.

## When to remove the FeedbackElement?

Many EventSequences start and end so quickly that humans cannot read a feedback image if it is *only* visible during such a short lifecycle. Examples of such EventSequences are `click`, `select`, loading network resources, and more. For such EventSequences the removal of the feedback image is delayed using a `setTimeout(..)`.

Delaying the removal of the FeedbackElement using `setTimeout(...)` is a boon. When the duration of the feedback is separated from the duration of the EventSequence, the *end* state of an EventSequence can be communicated to the user. This enables the EventSequence to answer such questions as:
 * did the gesture succeed or fail?
 * what was the *state* of the gesture when it ended? 
 * did the app register a "very fast event" such as a `click` or loading of a network resource?

Not for implementations: When two or more feedback elements from the same EventSequence are active in the DOM at the same time, due to for example a long delay before the FeedbackElement is removed, then the EventSequence can deep clone the BlindManDom layer element to disconnect it from new actions.

## Automated CSS properties for FeedbackElements 
 
The BlindManDom sets `display: fixed; pointer-events: none; z-index: 2147483647; overflow: visible; padding: 0; margin: 0;` on its layer element. 

The EventSequence can also add a `transform` style to the BlindManDom layer element. The `transform` style allows the EventSequence to efficiently (re)position the FeedbackElement together with a moving cursor. If the FeedbackElement rarely moves on screen, the less efficient `top`, `left`, `bottom`, `right` properties can be used instead.

Furthermore, some EventSequences dealing with duration, might also wish to automatically control the `animate` the `transform` and `opacity` properties on the BlindManDom layer element. For example, a `long-press` event might like the feedback element to `scale` up and become less opaque the longer the press has been held for. A two finger pan and rotate gesture might like to `transform: rotate(...)` the BlindManDom layer so as to indirectly rotate the FeedbackElement.

Thus, the automated CSS properties of the BlindManDom layer element are:
 * display: fixed; 
 * pointer-events: none; 
 * z-index: 2147483647; 
 * overflow: visible;
 * margin: 0;
 * padding: 0;
 * transform: translate scale and rotate
 * animate: => mainly (transform: scale and rotate)
 * top, left, bottom, right can be used instead of transform translate for still FeedbackElements.
 
When the BlindManDom layer needs to perform an automatic animation, then the BlindManDom layer element should be constructed as a web component, so to better bundle the more complex CSS code.

Other properties, such as `color`, `width`, `box-sizing`, `background`, `border` etc. should be controlled on the FeedbackElement and thus *not* automatically added/updated by the EventSequence.

## CSS pseudo-classes on the FeedbackElement

If an EventSequence adds pseudo-pseudo-classes to it's target elements, these pseudo-pseudo-classes should be mirrored on the FeedbackElement and BlindManDom element when they might need them.

Pseudo-pseudo-classes enables the developer controlling the FeedbackElement to alter the style of the FeedbackElement to illustrate different EventSequence states, using CSS animation if so be it.
   
## Demo: Naive `long-press` with bulls-eye

In this demo, we show the state of a `long-press` with an animated bulls-eye. The `long-press` event is deliberately naive (simple and do not handle edge cases).
1. When the initial `mousedown` is registered, the bulls-eye is added to the screen at the press location.
2. While the user keeps pressing, the bulls-eye grows and becomes less opaque.
3. When the user has pressed down as long as is needed to perform a `long-press`, the bulls-eye stops growing. 
4. When the user releases the press, the bulls-eye turns green if the press was long enough for a `long-press`, and red if it was not.
5. The bulls-eye is removed 250ms after the `long-press` cycle ends.

The demo uses a web component for `BlindManDomLayer` with a `grow-less-opaque` animation.

The FeedbackElement is also set up as a web component `PondRing` to add two animations:
 * one for switching from a single to double rings, and
 * one for when the EventSequence ends.

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
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 0.5;
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

    class PondRing extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.shadowRoot.innerHTML = `
<style>
  :host {
    display: block;
    box-sizing: border-box;
    width: 20px;
    height: 20px;
    padding: 0;
    margin: -10px 0 0 -6px;
    border: 3px double grey;
    border-radius: 50%;
  }
  :host(*.long-press-ends) {
    background: green;
  }
  :host(*.long-press-fails) {
    background: red;
  }
</style>`;
      }
    }

    customElements.define("long-press-pond-ring", PondRing);

    function dispatchPriorEvent(target, composedEvent, trigger) {
      composedEvent.preventDefault = function () {
        trigger.preventDefault();
        trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
      };
      composedEvent.trigger = trigger;
      return target.dispatchEvent(composedEvent);
    }

    var primaryEvent;
    var blindMan = document.createElement("blind-man-dom-layer");
    var feedbackElement = document.createElement("long-press-pond-ring");
    blindMan.appendChild(feedbackElement);

    function addVisualFeedback(x, y) {
      //using left and top instead of transform: translate(x, y) so as to simplify scale animation
      blindMan.style.left = x + "px";
      blindMan.style.top = y + "px";
      document.body.appendChild(blindMan);
    }

    function removeVisualFeedback(success, ttl) {
      const endState = success ? "long-press-ends" : "long-press-fails";
      blindMan.classList.add(endState);
      feedbackElement.classList.add(endState);
      setTimeout(function () {
        blindMan.classList.remove(endState);
        feedbackElement.classList.remove(endState);
        blindMan.remove();
      }, ttl);
    }

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
      if (duration > 600) {
        let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
        dispatchPriorEvent(e.target, longPress, e);
        removeVisualFeedback(true, 250);
      } else {
        removeVisualFeedback(false, 250);
      }
      primaryEvent = undefined;
      window.removeEventListener("mouseup", onMouseup, true);
    }

    window.addEventListener("mousedown", onMousedown, true);
  })();
</script>
<h1>Hello sunshine</h1>
<script>
  window.addEventListener("long-press", e => console.log(e.type));
</script>
``` 

## References

 * []()

