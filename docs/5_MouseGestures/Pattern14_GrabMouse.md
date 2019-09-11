## Pattern: GrabMouse

> You know I'm automatically attracted to beautiful—I just start kissing them. It's like a magnet. Just kiss. I don't even wait. And when you're a star, they let you do it. You can do anything. Grab 'em by the pussy. You can do anything.
> 
>   From ["Donald Trump *Access Hollywood* tape"](https://en.wikipedia.org/wiki/Donald_Trump_Access_Hollywood_tape)

Sometimes, in the midst of an EventSequence, it can seem as if the mouse has got a will of its own. Its own behavior or default action that seem to come out of nowhere. It doesn't happen all the time. But near some elements, the mouse does something completely unexpected: it selects text. 

When you make an EventSequence, this behavior is often unwanted. You have a completely different agenda, you are doing something else. So, what do you do? You GrabMouse.

## GrabMouse's defaultAction

To control the defaultAction of text selection by mouse, there is currently one main alternative: CSS property [`user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select).

You might have expected that this event would be controlled from JS via `.preventDefault()` on `mousedown` or `mousemove`, or from HTML as an attribute. But no. The default action of the mouse is far harder to both read and understand than that.

First, there are no HTML attributes that directly control mouse events. From HTML you must set the `user-select` in the `style` attribute to control mouse events.
                                            
Second, JS controls text selection via `select` events. These events are composed events triggered by `mousedown`, `mousemove` and `mousemove`. But from mouse events they are *unpreventable*, same as `click`: Calling `.preventDefault()` on mouse events stops neither their `click` nor `select` native composed events.

This could spell trouble. What if the browser already reads, captures, and locks the `user-select` CSS property *before* the `mousedown` event is dispatched? Thankfully, it doesn't. If you set the `user-select` property during `mousedown` propagation, it *will* control the `select` event and text selection behavior.

To dynamically control the actions of mouse events during an EventSequence, we therefore need to:
1. set `user-select: none` on the `<html>` element when the sequence starts (ie. on `mousedown`) and
2. restore the the `<html>` element's original `user-select` value when the sequence ends (ie. on `mouseup` and/or `mouseout`, cf. the ListenUp pattern). 

## IE9: GrabMouse with both hands

`user-select` is only supported by IE10. Thus, if you want to GrabMouse, and you need to include IE9, you need to "GrabMouse with both hands". First, you specify the `user-select` property as described above. Second, you add a secondary event trigger for the `selectstart` event and call `.preventDefault()` and `stopImmediatePropagation()` on this event. Grabbing the mouse with both hands like this will ensure that no text selection will occur during your mouse-oriented EventSequence.

```javascript
var onSelectstart = function (e){                           
  e.preventDefault();
  e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
}
```

## Example: `long-press` grabbed with both hands

To make a safer `long-press` we need to GrabMouse. GrabMouse prevents native text selection behavior from interfering with our custom composed DOM EventSequence. To GrabMouse with both hands we:
1. initially add the `user-select: none` attribute on the `<html>` element,
2. add an extra event listener for `selectstart` event and that calls `e.preventDefault()`, and
3. conclude by resetting the `<html>` element's `user-select` style property.

The resulting `long-press` composed event trigger function is:

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

var primaryEvent;                                               
var userSelectCache;                                            //[1]

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup);             
  window.addEventListener("selectstart", onSelectstart);        //[2]   
  userSelectCache = document.children[0].style.userSelect;      //[1]
  document.children[0].style.userSelect = "none";               //[1]
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup);             
  window.removeEventListener("selectstart", onSelectstart);     //[2]      
  document.children[0].style.userSelect = userSelectCache;      //[1]
}

function onMousedown(e){                                        
  startSequenceState(e);                                             
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

function onSelectstart(e){                                       //[2]
  e.preventDefault();
}

window.addEventListener("mousedown", onMousedown);              

//1. The initial trigger function caches the value of the CSS `user-select` 
//   property on the element and sets its value to `none`.
//   At the end of the EventSequence, the value of the CSS `user-select` is reset. 
//2. The initial trigger function adds an event listener for `selectstart`.
//   At the end of the EventSequence, the event listener for `selectstart` is removed again. 
```

## Demo: `long-press` grabbed with both hands 

```html
<div id="one">
  You can long-press me with the mouse. The long-press is a click longer than 300ms.
  This long-press is "grabbed with both hands", meaning that you should not be able 
  to be able to select this text when you press on it.
</div>

<script>
document.querySelector("#two").addEventListener("mousedown", function(){
  setTimeout(function(){
    alert("I'm trying to trip things up");
  }, 10);
});

window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
window.addEventListener("long-press-cancel", function(e){
  console.log("long-press", e);
});
</script>
```

## References

 * 