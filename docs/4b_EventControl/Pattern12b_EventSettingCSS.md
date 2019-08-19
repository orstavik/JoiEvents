# Pattern: CssEventSettings

CSS properties can be used to control the behavior of native gestures and events. For example, adding `pointer-events: none` to an element, will make pointer events skip the element in its interpretation. Setting `cursor: crosshair` on another element will alter the icon of the mouse cursor when the element is hovered. Other examples of CSS properties controlling event and gesture behavior are: `touch-action`, todo... (CSS pseudo-classes such as `:hover` and `:visited` also control the interaction between the DOM and events, but as CSS does not provide custom CSS pseudo-classes yet, we will not discuss this here.)

Custom CSS properties can be used to control custom composed events. For example could a custom CSS property `--long-press-duration: 500ms` be used to control the time a user needed to press down on something to trigger a `long-press` event. Similarly, a custom `--long-press-symbol: bullseye` vs `--long-press-symbol: circle` could be used to alter the feedback symbol an event (see Pattern: ChooseFeedback in the next chapter).

## Issues implementing CssEventSettings

CSS custom properties cascade. And they can override each other. Let's look at an example:
```html
<style>
  body {
    cursor: crosshair;
  }
  #a {
    cursor: help;
  }
</style>
<div id="a">A</div>
<div id="b">B</div>
```
If you hover `A`, then the mouse will be a `help` question mark; if you hover `B`, it will be a `crosshair`. This means that if a custom event like `long-press` were to add its own custom property `--long-press-duration` to control the event over a target, we would need to call `getComputedStyle("--long-press-duration", targetElement)` to get its current value.

Calling `getComputedStyle()` during JS is heavy. And so a natural impulse would be to lower the potential cost of this action by delaying this operation until the next `requestAnimationFrame()`. But, this doesn't work. The timing of composed events is not independent, as described in the PriorEvent and AfterthoughtEvent patterns: they need to process their responses synchronously. Thus, `getComputedStyle()` must be called synchronously.

CSS properties that control native gestures such as `pointer-events` and `touch-action` are read at the gesture's initial event and then applies until the gesture ends. This means for example that it doesn't help to set `pointer-events: none` from within a `touchstart` event listener. (todo does this apply to cursor as well??) CSS properties are therefore read at the start of the gesture / and will then apply until the gesture ends.

## Demo: `--long-press-duration`

```javascript
(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;
  var duration;

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    duration = getComputedStyle():
    window.addEventListener("mouseup", onMouseup);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    var longPressDurationSetting =                          //[1]
      e.target.getAttribute("long-press-duration") ||
      document.children[0].getAttribute("long-press-duration") ||
      300;
    //trigger long-press iff the press duration is more than the long-press-duration EventSetting
    if (duration > longPressDurationSetting){
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    window.removeEventListener("mouseup", onMouseup);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();
//1. The `long-press-duration` EventSetting is grabbed once,
//   when first needed, and then reused.

```

## References
