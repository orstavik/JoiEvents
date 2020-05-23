# Guaranteed bubble listener:

The purpose of the GuaranteedBubbleListener is to have an event listener that: 
1. inside a DOM context,
2. runs for all instances of an event type,
3. during the bubble(/target bubble) phase.

This is critical for making functionality such as event controllers able to run in DOM context bottom-up.

## Strategy

To add a GuaranteedBubbleListener for *bubbling* events is simple: 
 * add a static unstoppable event listener on the propagation root.
 
However, to make a GuaranteedBubbleListener for *non-bubbling* events is a bit more convoluted:
1. add a static unstoppable event listener on the propagation root in the capture phase,
2. from this static event listener, add another *dynamic, `unstoppable: true, native once: true, capture: false`* event listener on the target with the needed event listener function. The `.target` on the event in the static capture phase event listener will be local to the given DOM context.

## Interface

The method of adding a GuaranteedBubbleListener should be added to the PropagationRoot, ie. the ShadowRoot or the Document (or the Window). The event listener is unique to the DOM context, not to the individual EventTarget.

The method needs the `eventName`, the callback `function`, and an option `onTarget` to specify if the `eventName` will be on a non-bubbling event.

The method uses a register of all event types which are non-bubbling.

```javascript
const nonBubblingEvents = ["toggle","load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "pointerenter", "pointerleave", "pointerleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

//on the propagationRoot
function addGuaranteedBubbleListener(propagationRoot, eventname, fun, onTarget) {
  if (nonBubblingEvents.indexOf(eventname) === -1 && !onTarget)
    return propagationRoot.addEventListener(eventname, fun);
  const onTargetWrapper = function (e) {
    e.target.addEventListener(eventname, fun, {once: true});
  }
  return propagationRoot.addEventListener(eventname, onTargetWrapper, {capture: true});
}
```  

## Demo:

```html
<script>
  const nonBubblingEvents = ["toggle","load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "pointerenter", "pointerleave", "pointerleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

  //on the propagationRoot
  function addGuaranteedBubbleListener(propagationRoot, eventname, fun, onTarget) {
    if (nonBubblingEvents.indexOf(eventname) === -1 && !onTarget)
      return propagationRoot.addEventListener(eventname, fun);
    const onTargetWrapper = function (e) {
      e.target.addEventListener(eventname, fun, {once: true});
    }
    return propagationRoot.addEventListener(eventname, onTargetWrapper, {capture: true});
  }
</script>

<div>
  <span>hello sunshine</span>
  <hr>
  <h1>hello world</h1>
  <hr>
  <details><summary>hello</summary> toggle</details>
  <hr>
  <details><summary>hello</summary> toggle 2</details>
</div>

<script>
  addGuaranteedBubbleListener(document, "click", e=> console.log("normal", e.type, e.currentTarget, e.eventPhase));
  addGuaranteedBubbleListener(document, "click", e=> console.log("onTarget", e.type, e.currentTarget, e.eventPhase), true);
  addGuaranteedBubbleListener(document, "toggle", e=> console.log("normal", e.type, e.currentTarget, e.eventPhase));
  addGuaranteedBubbleListener(document, "toggle", e=> console.log("onTarget", e.type, e.currentTarget, e.eventPhase), true);
</script>
```

## References

 * dunno