# Pattern: CancelClick

## Preventable native composed events

Some native composed events are preventable. 
For example, the native composed `submit` event can be prevented from its triggering `click` event.
If you:

1. click on a `<button type="submit">` inside a `<form>`, 
2. call `.preventDefault()` on the ensuing `click` event, then 
3. the `submit` event will *not* be dispatched.

## Unpreventable native composed events

However, some native composed events such as `click` are *unpreventable*.
`click`s can be created by the user `mousedown` and then `mouseup` within the same `target`. 
`click` is a mini-gesture. One might imagine that calling `preventDefault()` on the `mouseup` event 
would prevent the `click` event from being dispatched. 
But it doesn't. The `click` cannot be prevented.

This can cause conflict. Lets look at an example with an imagined, custom composed event called 
"custom-draggable":

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

In this example, the script initiates a mouse-based gesture on `<div id="child">`.
It then adds a listener for:
 * `click` on `<div id="parent">` and 
 * `custom-dragstart` on `<div id="child">`.
Now, it is highly likely that both the user and the app developer would consider custom-drag gesture
to *replace* the native `click` gesture.
In fact, it is likely that both the user and the app developer would not expect a `click` event
to be fired if the user initiates a drag EventSequence on `<div id="child">`.
This confusion would lead to bugs or alternatively highly complex code in both sets of event listeners,
and the best way to avoid these problems would be to have the custom-draggable mouse-based gesture
cancel the click event. But, how to do that? How to prevent an unpreventable event?

## HowTo: cancel `click`

To cancel unpreventable `click`s in a mouse-based EventSequence you should:

1. in the **last** trigger function for the **`mouseup`**,
2. add a one-time EarlyBird event listener for the next `click` that
3. calls both `.preventDefault()` and `stopImmediatePropagation()` to cancel this event.
4. If the custom mouse-based gesture is cancelled for other reasons, 
   the custom event must evaluate if it should or should not cancel the next `click`.
   
When a mouse-based gestures needs to cancel subsequent, unpreventable `click` events, 
they most likely need to do so most of the time. You should therefore expect CancelClick to be 
the default behavior of custom composed mouse-based events that need it.
However, it would yield good develer ergonomics to provide an EventAttribute called `do-click` 
that enables the user of the event to let the `click` event be dispatched anyway. 
`do-click` would prevent the prevention of the unpreventable `click` so to speak.

The implementation of the `do-click` attribute is straight-forward and follows the EventAttribute pattern.
The implementation of one-time EarlyBird event-cancelling trigger functions is described below.

## HowTo: implement one-time EarlyBird event-cancelling trigger functions

A one-time EarlyBird event-cancelling trigger function can be made using either
a) the EventListener option `once: true` or b) a self-removing event listener function.
Below is a setup that feature checks for a), and then if so chooses a), and if not b).

```javascript
var supportsOnce = false;
try {
  var opts = Object.defineProperty({}, 'once', {
    get: function() {
      supportsOnce = true;
    }
  });
  window.addEventListener("test", null, opts);
  window.removeEventListener("test", null, opts);
} catch (e) {}

var cancelEvent = function(e){
  e.preventDefault();
  e.stopImmediatePropagation ? 
    e.stopImmediatePropagation() : 
    e.stopPropagation();
};

var cancelEventSelfRemoving = function(e){
  e.preventDefault();
  e.stopImmediatePropagation ? 
    e.stopImmediatePropagation() : 
    e.stopPropagation();
  window.removeEventListener("click", cancelEventSelfRemoving, true);
};

supportsOnce ? 
  window.addEventListener("click", cancelEvent, {capture: true, once: true}):
  window.addEventListener("click", cancelEventSelfRemoving, true);
```   

## Example: `long-press` with CancelClick

In this example we add the CancelClick pattern to our naive, composed `long-press` event.

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

var supportsOnce = false;                                              //[1] start
try {
  var opts = Object.defineProperty({}, 'once', {
    get: function() {
      supportsOnce = true;
    }
  });
  window.addEventListener("test", null, opts);
  window.removeEventListener("test", null, opts);
} catch (e) {}

var cancelEvent = function(e){
  e.preventDefault();
  e.stopImmediatePropagation ? 
    e.stopImmediatePropagation() : 
    e.stopPropagation();
};

var cancelEventSelfRemoving = function(e){
  e.preventDefault();
  e.stopImmediatePropagation ? 
    e.stopImmediatePropagation() : 
    e.stopPropagation();
  window.removeEventListener("click", cancelEventSelfRemoving, true);  //[1] ends
};

var primaryEvent;                                               

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true); 
}

function resetSequenceState(doClick){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  if (doClick)                                                         //[3]
    return;
  supportsOnce ?                                                       //[2]
    window.addEventListener("click", cancelEvent, {capture: true, once: true}):
    window.addEventListener("click", cancelEventSelfRemoving, true);
}

function onMousedown(e){
  startSequenceState(e, doClick);                                             
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  var doClick =                                                        //[3]
    e.target.getAttribute("do-click") || 
    document.children[0].getAttribute("do-click");
  resetSequenceState(doClick);                                         
}

window.addEventListener("mousedown", onMousedown);              

//1. Set up the cancelEvent(e) function.
//2. Add the cancelEvent(e) function as a one-time EarlyBird secondary trigger.
//3. Check for the do-click attribute on the target or the root element.
```

## Demo: `long-press` cancels `click`
```html
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