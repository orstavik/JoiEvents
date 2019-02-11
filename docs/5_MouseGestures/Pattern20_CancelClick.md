# Pattern: CancelClick

## Preventable vs. unpreventable native composed events

Some native composed events are preventable. 
For example, the native composed `submit` event can be prevented from its triggering `click` event.
If you:

1. click on a `<button type="submit">` inside a `<form>`, 
2. call `.preventDefault()` on the ensuing `click` event, then 
3. the `submit` event will *not* be dispatched.

However, some native composed events are *unpreventable*.
For example, the native composed event `click` can be created by the user doing a `mousedown` and then
a `mouseup`, within the same `target`. 
Thus, if you:

1. `mousedown` on a `<div id="a">`, 
2. `mouseup` on the same `<div id="a">`, 
3. call `.preventDefault()` on `mouseup`, and `mousedown` for good measure, then 
4. the `click` event will *still* be dispatched on `<div id="a">`.

This can create tension and conflict. What if we:
 * on element A add a mouse-based EventSequence A, that once triggered should completely grab all 
   the users mouse gesturing and intentions, while
 * at the same time on element C, a parent of element A, add a `click` listening device that should grab 
   all user clicks *except* the mouse-based gestures on element A?
   
What if we really wanted to specify that if the user has activated a certain mouse-based gesture, 
then this gesture should trump and cancel the `click`?

## HowTo: implement CancelClick

The simplest approach to cancel unpreventable `click`s in a mouse-based EventSequence is to:
1. in the initial trigger function add a one-time EarlyBird event listener that
2. essentially cancels the next `click` event by calling both `.preventDefault()` and 
   `stopImmediatePropagation()`.
   
If a mouse-based gestures that needs to cancel subsequent, unpreventable `click` events, 
they will likely need to do so more often than not. To CancelClick should be default behavior
of custom composed mouse-based events that require it.

However, an EventAttribute called `do-click` should also be added that will allow the user of the
event to turn this feature off. And this `do-click` attribute should be attachable to both 
the `target` element or the root HTML element.

The implementation of the `do-click` attribute is straight-forward and follows the EventAttribute pattern.
The implementation of one-time EarlyBird event-cancelling trigger functions is described below.

## HowTo: implement one-time EarlyBird event-cancelling trigger functions

A one-time EarlyBird event-cancelling trigger function can be made in two ways using:

1. The EventListener option `once: true`:
 
```javascript
var cancelEvent = function(e){
  e.preventDefault();
  e.stopImmediatePropagation ? 
    e.stopImmediatePropagation() : 
    e.stopPropagation(); 
};
window.addEventListener("click", cancelEvent, {capture: true, once: true});
```
   
2. A self-removing event listener function:

```javascript
var cancelEvent = function(e){
  e.preventDefault();
  e.stopImmediatePropagation ? 
    e.stopImmediatePropagation() : 
    e.stopPropagation();
  window.removeEventListener("click", cancelEvent, true);
};

window.addEventListener("click", cancelEvent, true);
```

To feature check then combine both can be done like this:

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

function startSequenceState(e, doClick){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true); 
  if (!doClick){                                                       //[3]
    supportsOnce ?                                                     //[2]
      window.addEventListener("click", cancelEvent, {capture: true, once: true}):
      window.addEventListener("click", cancelEventSelfRemoving, true);
  }
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
}

function onMousedown(e){
  var doClick =                                                        //[3]
    e.target.getAttribute("do-click") || 
    document.children[0].getAttribute("do-click");
  startSequenceState(e, doClick);                                             
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedown);              

//1. Set up the cancelEvent(e) function.
//2. Add the cancelEvent(e) function as a one-time EarlyBird secondary trigger.
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