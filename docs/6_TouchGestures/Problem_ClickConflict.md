# Problem: ClickConflict

This chapter builds on [Pattern: CancelClick](../2_EventToEvent/5_Pattern20_CancelClick).

Mouse-based gestures such as a drag'n'drop can be active on an element that is a descendant of an element that listens for `click` events. The ancestor element might desire to listen for `click` events on several of its other children elements, thus listening for the same `click` event at a higher level. If you are making a mouse-based gesture that you know will conflict with `click` events and therefore should cancel them, you need to somehow cancel the trailing, domino `click` events. 

This can cause conflict. Lets look at an example with an imagined, custom composed event called "custom-draggable":

```html
<div id="parent">
  <div id="child" custom-draggable>
    Hello click conflict.
  </div>
</div>

<script>
document.querySelector("#parent").addEventListener("click", alert("Parent clicked!"));
document.querySelector("#child").addEventListener("custom-dragstart", alert("Child dragging!"));
</script>
```

In this example, the script initiates a mouse-based gesture on `<div id="child">`. It then adds a listener for:
 * `click` on `<div id="parent">` and 
 * `custom-dragstart` on `<div id="child">`.

Now, it is highly likely that both the user and the app developer would consider custom-drag gesture to *replace* the native `click` gesture. In fact, it is likely that both the user and the app developer would not expect a `click` event to be fired if the user initiates a drag EventSequence on `<div id="child">`. This confusion would lead to bugs or alternatively highly complex code in both sets of event listeners, and the best way to avoid these problems would be to have the custom-draggable mouse-based gesture cancel the click event. But, how to do that? How to prevent an unpreventable event?

## Example: `long-press` with `cancelEventOnce("click")` and `do-click` attribute

When a mouse-based gestures needs to cancel subsequent, unpreventable `click` events, they most likely need to do so most of the time. You should therefore expect CancelClick to be  the default behavior of custom composed mouse-based events that need it. However, it would yield good developer ergonomics to provide an EventAttribute called `do-click` that enables the user of the event to let the `click` event be dispatched anyway. `do-click` would prevent the prevention of the unpreventable `click` so to speak.

The implementation of the `do-click` attribute is straight-forward and follows the EventAttribute pattern. The implementation of one-time EarlyBird event-cancelling trigger functions is described below.

In this example we add the CancelClick pattern to our naive, composed `long-press` event.

> todo untested

```html
<script >
function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

function cancelEventOnce(type) {
  const oneTimer = function (e) {
    e.stopPropagation();
    e.preventDefault();
    window.removeEventListener(type, oneTimer, true);
  };
  window.addEventListener(type, oneTimer, true);
}

var primaryEvent;                                               

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true); 
}

function resetSequenceState(doClick){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  if (!doClick)                                                        
    cancelEventOnce("click");
}

function onMousedown(e){
  startSequenceState(e, doClick);                                             
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  var doClick =                                                       
    e.target.getAttribute("do-click") || 
    document.children[0].getAttribute("do-click");
  resetSequenceState(doClick);                                         
}

window.addEventListener("mousedown", onMousedown);              
</script>
<div id="one">
  Press me more than 300ms for a long-press.
  This will cancel the ensuing click function.
</div>

<div id="two" do-click>
  Press me more than 300ms for a long-press.
  I will NOT cancel the ensuing click function.
</div>

<script>
window.addEventListener("click", function(e){
  console.log("click", e);
});
window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
</script>
```

## References

 * 