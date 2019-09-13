# Event: `long-press`

The `long-press` event give the app the ability to differentiate between different types of clicks.
The `long-press` event is global, it will be dispatched on all elements (that dispatch mouse events).
But, the `long-press` has an EventAttribute `long-press-duration` that can be attached to individual
target elements or globally to the HTML root element.

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
  window.addEventListener("mouseup", onMouseup, true);             
  window.addEventListener("selectstart", onSelectstart);        //[2]   
  userSelectCache = document.children[0].style.userSelect;      //[1]
  document.children[0].style.userSelect = "none";               //[1]
  
  window.addEventListener("mouseleave", onMouseleave, true);          //[1]
  window.addEventListener("focusin", onFocusin, true);                //[3]
  window.addEventListener("mousedown", onMousedownSecondary, true);   //[2]
  window.removeEventListener("mousedown", onMousedownInitial, true);  //[2]
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
  window.removeEventListener("selectstart", onSelectstart);     //[2]      
  document.children[0].style.userSelect = userSelectCache;      //[1]
  
  window.removeEventListener("mouseleave", onMouseleave, true);       //[1] 
  window.removeEventListener("focusin", onFocusin, true);             //[3]
  window.removeEventListener("mousedown", onMousedownSecondary, true);//[2]
  window.addEventListener("mousedown", onMousedownInitial, true);     //[2]
}

function onMousedownInitial(e){                                        
  if (e.button === 0)                                           //[2]
    startSequenceState(e);                                             
}

function onMousedownSecondary(e){                               //[2]         
  dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                       
}

function onMouseleave(e){                                       //[1]
  dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

function onFocusin(e){                                          //[3]
  dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

function onSelectstart(e){                                       //[2]
  e.preventDefault();
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  var longPressDurationSetting = 
    e.target.getAttribute("long-press-duration") ||             //[1]
    document.children[0].getAttribute("long-press-duration") ||
    300;
  //trigger long-press iff the press duration is more than the long-press-duration EventSetting
  if (duration > longPressDurationSetting && e.target === primaryEvent.target)       
    dispatchPriorEvent(primaryEvent.target, new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}), e);
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedown); 
```
## Demo


## Reference

* [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent)