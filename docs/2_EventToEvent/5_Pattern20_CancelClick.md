# Pattern: CancelClick

`click` is an event that can be composed from a `mousedown`+`mouseup` or `touchstart`+`touchend` 
pair on the same DOM element. To cancel the trailing, composed `click` event from a 
`touchstart`+`touchend` pair is simple: call `.preventDefault()` on the `touchend` event.

But. To call `.preventDefault()` on the `mouseup` event does not work: the `click` event cannot
be cancelled from the mouse events. Therefore, we need a different technique to prevent the 
`click` event from `mouseup`.

## HowTo: `cancelClickOnce()`

The next best thing to be able to prevent the `click` event from occurring, is to stop its propagation
and defaultAction as soon as possible. We do this by adding an event listener for the next `click` 
that *first* calls `stopPropagation()` and `.preventDefault()` on the event, and *then* removes itself.

```javascript
const cancelClickOnce = function(){
  window.addEventListener("click", function(e){
    e.stopPropagation();                //*
    e.preventDefault();
    window.removeEventListener("click", cancelClickOnce, true);
  }, true);
};

```
 * Use `stopPropagation()`, not `stopImmediatePropagation()`. 
   If, for some reason, this `cancelClickOnce()` is called twice, 
   `stopPropagation()` will work just fine, while `stopImmediatePropagation()` will cause the two or 
   more `click`s to be canceled. 

## Example 1: CancelClickOnce

```html
<div id="test">
  <div id="box">
    <h1 id="sunshine">Hello sunshine!</h1>
  </div>
  <form action="#HelloSunshine">
    <input value="click for sunshine!" type="submit">
  </form>

  <a href="#helloWorld">hello world</a>
</div>

<script>
  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type);
  }

  const test = document.querySelector("#test");
  //logs
  test.addEventListener("submit", log);
  test.addEventListener("click", log);
  test.addEventListener("mouseup", log);
  test.addEventListener("touchend", log);

  const cancelClickOnce = function(){
    window.addEventListener("click", function(e){
      e.stopPropagation();
      e.preventDefault();
      window.removeEventListener("click", cancelClickOnce, true);
    }, true);
  };


  test.addEventListener("mouseup", cancelClickOnce);

</script>
```

> Other approaches such as setting a temporary `pointer-events: none` somewhere in the DOM during the 
> `mousedown` event, doesn't work. Your best and simplest bet is to `cancelClickOnce()` during the 
> `mouseup` event.

## Why CancelClick?

Mouse-based gestures such as a drag'n'drop can be active on an element that is a descendant of 
an element that listens for `click` event. The ancestor element might desire to listen for 
`click` events on several of its other children elements, thus listening for the same `click` event 
at a higher level. If you are making a mouse-based gesture that you know will conflict with `click`
events and therefore should cancel them, you need to somehow cancel the trailing, domino `click`
events. 

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

## Example: `long-press` with `cancelClickOnce()` and `do-click` attribute

> todo move this back to the mouse chapter?

When a mouse-based gestures needs to cancel subsequent, unpreventable `click` events, 
they most likely need to do so most of the time. You should therefore expect CancelClick to be 
the default behavior of custom composed mouse-based events that need it.
However, it would yield good developer ergonomics to provide an EventAttribute called `do-click` 
that enables the user of the event to let the `click` event be dispatched anyway. 
`do-click` would prevent the prevention of the unpreventable `click` so to speak.

The implementation of the `do-click` attribute is straight-forward and follows the EventAttribute pattern.
The implementation of one-time EarlyBird event-cancelling trigger functions is described below.

In this example we add the CancelClick pattern to our naive, composed `long-press` event.

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

const cancelClickOnce = function(){
  window.addEventListener("click", function(e){
    e.stopPropagation();
    e.preventDefault();
    window.removeEventListener("click", cancelClickOnce, true);
  }, true);
};

var primaryEvent;                                               

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true); 
}

function resetSequenceState(doClick){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  if (!doClick)                                                        
    cancelClickOnce();
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

 * [Stackoverflow: cancelClick](https://stackoverflow.com/questions/17441810/pointer-events-none-does-not-work-in-ie9-and-ie10#answer-17441921)
 * [MDN: pointer-events: none](https://css-tricks.com/almanac/properties/p/pointer-events/)