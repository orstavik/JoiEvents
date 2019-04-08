# Pattern: GrabTouch

## Dynamic control

When composing EventSequences, you need to establish control over the behavior of other 
DOM Events *dynamically*.
It is only when *activated* that the patterns take control of the other events.
While the EventSequence remains active, this control is maintained. 
But when the EventSequence ends, the control is released and its original settings restored.

*Dynamic control* is imposed only when-and-while-needed, on-the-go.
*Dynamic* control is not a *static* aspect of the DOM, but 
a state of the DOM enforced by an imperative sequence.

## Example: Naive `single-tap` that GrabTouch

A "tap" gesture is a click with the finger. `click` fulfills most of the purposes of "tap", 
and this `single-tap` example is therefore mostly presented to illustrate the GrabTouch pattern.
The `single-tap` gesture is an AttributeFilteredEvent via the `single-tap` attribute.

The `single-tap` gesture adds an initial trigger function for `touchstart`.
This initial trigger function:
1. checks that the `touchstart` target (or one of its parents) has a `single-tap` attribute,
2. adds a secondary trigger function for `touchend`, and
3. dynamically grab the control of the native touch-based behavior from the `touchstart`.

The secondary `touchend` trigger function:
1. releases the native touch-based behavior (which is nothing),
2. dispatches a `single-tap` event on the target, and
3. removes itself.

In order to ensure that the `touchstart` initial trigger function will be able to prevent the
native behavior, we must add the ugly supportsPassive feature check.

```javascript
(function(){
  var supportsPassive = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function() {
        supportsPassive = true;
      }
    });
    window.addEventListener("test", null, opts);
    window.removeEventListener("test", null, opts);
  } catch (e) {}
  var thirdArg = supportsPassive ? {passive: false, capture: true}: true;

  function filterOnAttribute(e, attributeName) {                //1
    var target = e.composedPath ? e.composedPath()[0] : e.target;
    for (var el = target; el; el = el.parentNode) {
      if (el.hasAttribute && el.hasAttribute(attributeName))
        return el;
    }
  }
  
  function dispatchPriorEvent(target, composedEvent, trigger) {   
    composedEvent.preventDefault = function () {                  
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;                              
    target.dispatchEvent(composedEvent);                   
  }
  
  function onTouchend(e) {
    //no release of dynamically GrabTouch necessary
    dispatchPriorEvent(newTarget, new CustomEvent("single-tap", {bubbles: true, composed: true}), e);    
    window.removeEventListener("touchend", onTouchend, true);
  }
  
  function onTouchstart(e){
    var newTarget = filterOnAttribute(e, "single-tap");
    if (!newTarget)                                           //2
      return;
    e.preventDefault();
    window.addEventListener("touchend", onTouchend, true);
  }

  window.addEventListener("touchstart", onTouchstart, thirdArg);
})();
```
All native default touch actions are dynamically blocked. 

## Example: `single-tap` that GrabTouch


## References

 * 
