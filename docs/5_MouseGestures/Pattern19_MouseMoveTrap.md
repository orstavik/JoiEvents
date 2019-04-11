# Pattern: MouseMoveTrap

When the user moves the mouse pointer outside of the scope of the window,
this can cause problems some problems:

1. Some mouse-based gestures, such as drag'n'drop, might implicitly rely on the user only dragging an 
   element inside the window.
2. Some browsers might miss `mouseup` nor `mousedown` events (todo test this) when the mouse is 
   "out of scope" of the `window`.

Therefore, many gestures are `click`, custom long-press events, native drag events, and custom drag events
need to *cancel* their actions when the mouse is moved outside of the `window`.

## HowTo: detect mouse-out-of-bounds 

These gestures are setup as ListenUp EventSequences.
They start with an initial `mousedown` trigger function. Once triggered, this `mousedown` listener
adds a secondary `mouseup` event trigger. Simply put, the gesture run from `mousedown` to `mouseup`. 
But, if the user moves the mouse out bounds and then release the mouse button, 
this secondary `mouseup` trigger function *will not* be called. 
The user thinks the gesture has ended, while the EventSequence still (incorrectly) thinks the gesture 
is active. Thus, when the mouse later returns to the `window`, 
the secondary trigger functions will continue to listen for `mousemove` events and dispatch composed 
events based on them.

There are two ways to detect a mouse-out-of-bounds: 

1. The coordinates for the current `mousemove` is outside of the `window` boundaries.
 
2. A `mouseout` event is triggered on the root `<HTML>` element: `document.children[0]`.

To check if mouse-out-of-bounds during a `mousemove`, the following method can be used:
```javascript
function mouseOutOfBounds(move) {
  return move.clientY < 0 || 
         move.clientX < 0 || 
         move.clientX > window.innerWidth || 
         move.clientY > window.innerHeight;
}
```
To check for mouse-out-of-bounds using `mouseout`, use:
```javascript
document.children[0].addEventListener("mouseout", function(){/*cancel the mouse-based gesture*/});
```

It is best to check `mouseOutOfBounds(mouseMoveEvent)` inside a `mousemove` event listener.
The reason for this is that sometimes `mouseout` events are not dispatched when the mouse exits the 
`window` (unknown for what reason). Furthermore, most mouse-based EventSequences already listen for 
and process `mousemove` events as part of their operation. Adding an extra arithmetic check in an already 
triggered event listener function is considered faster or as fast as adding an additional event listener 
for another event.

//todo check if mousemove are registered outside of the scope of the window in all other browsers too.
//todo and for all applications, even when they do not alter the underlying content.
//todo maybe we need both mousemove and mouseout.

## Example: `long-press` with MouseMoveTrap

To illustrate how a MouseMoveTrap can be sprung, we add it to `long-press`.

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

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true);             
  window.addEventListener("mousemove", onMousemove, true);            //*
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  window.removeEventListener("mousemove", onMousemove, true);         //* 
}

function onMousedown(e){                                        
  if (e.button === 0)                                                 
    startSequenceState(e);                                             
}

function onMousemove(e){                                              //*
  if (mouseOutOfBounds(e)){
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}), e);
    resetSequenceState();                                             
  }
}

function mouseOutOfBounds(move) {
  return move.clientY < 0 || 
         move.clientX < 0 || 
         move.clientX > window.innerWidth || 
         move.clientY > window.innerHeight;
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedown);              
```

## Demo: `long-press` in jail
```html
<div id="one">
  Press me more than 300ms for a long-press.
  If you move the mouse cursor outside of the 
  scope of the window, while you press, 
  the long-press will be canceled.
</div>

<script>

window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
window.addEventListener("long-press-cancel", function(e){
  console.log("long-press-cancel", e);
});
</script>
```

## Discussion: which coordinate to use when canceled?

`mousemove` events may be triggered hundreds of pixels apart. This means that the breakout `mousemove` 
event can have coordinated such as `x: -47, y: -123`. Thus, when a mouse-based gesture is
cancelled, the coordinates of the last mouse event that was successfully part of the gesture should be 
used, and not the coordinates of the event that disrupts the mouse-based gesture.

## Calculate Point of Exit

If you really want the guesstimate where the mouse left the window (ie. calculate its point of 
exit), use this method:

```javascript
//todo untested
function pointOfExit(x1, y1, x2, y2, left, top, right, bottom){
  const distX = Math.min(x2-left, right-x2, 0);   //if both are inside, then 0 is chosen  
  const distY = Math.min(y2-top, bottom-y2, 0);
  const distBorder = !distX ? distY * -1 :        //if one of the distances is inside, then simplify
                     !distY ? distX * -1 : 
                     Math.sqrt(distX*distX + distY*distY);
  const moveX = x2-x1;
  const moveY = y2-y1;
  const distMove = Math.sqrt(moveX*moveX + moveY*moveY);
  const proportionOutside = distBorder / distMove;  //this is the proportion of the distance the mouse travelled outside the window
  //return the nearest point of exit. One of the values should equal either left, top, right, bottom
  return [Math.round(x2-(moveX*proportionOutside)), Math.round(y2-(moveY*proportionOutside))];
}
//insideMove is the last known position inside the window
//outsideMove is the first known position outside the window
const [x,y] = pointOfExit(insideMove.x, insideMove.y, outsideMove.x, outsideMove.y, 0, 0, window.innerWidth, window.innerHeight);
``` 

## References

 * 
