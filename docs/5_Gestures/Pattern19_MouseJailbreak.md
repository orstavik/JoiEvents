## Pattern: MouseJailbreak

Sometimes, when trying to handle mouse events, the mouse will behave unexpectedly: 
it will suddenly make a break for it. This get-away is often highly surprising for the developer and 
can cause errant behavior run-time. We call this the MouseJailbreak problem.
The mouse has three cunning plans to escape the grip of the developer.

> and during that time, you will neither receive nor control the mouse events. 

> When the mouse makes a getaway during one of your EventSequences, you should not attempt to stop it.
When the mouse wants to break free, you should let it. Instead of trying to impose control on it,
which is futile, your EventSequence should simply observe the situation and abort.

## MouseJailbreak #1: out of bounds

The user moves the mouse pointer outside of the app's window.
As one might expect, while the mouse is out of bounds of the `window` object, 
the app will not receive any `mousemove` events. Missing mousemoves can be annoying, but 
will rarely break the app's behavior.

But, what often is a big problem, is that the app does not receive any `mouseup` nor 
`mousedown` events neither while the mouse is out of bounds. 
Many mouse-based, composed events are gestures. 
Examples of such gestures are `click`, custom long-press events, native drag events, and custom drag events.

These gestures are setup as ListenUp EventSequences.
They start with an initial `mousedown` trigger function. Once triggered, this `mousedown` listener
adds a secondary `mouseup` event trigger. Simply put, the gesture run from `mousedown` to `mouseup`. 
But, if the user moves the mouse out bounds and then release the mouse button, 
this secondary `mouseup` trigger function *will not* be called. 
The user thinks the gesture has ended, while the EventSequence still (incorrectly) thinks the gesture 
is active. Thus, when the mouse later returns to the `window`, 
the secondary trigger functions will continue to listen for `mousemove` events and dispatch composed 
events based on them.

There are two ways to guard against the mouse-out-of-bounds Jailbreak: 

1. In every `mousemove` secondary trigger function, add a test that ensures the anticipated, 
   necessary buttons are being pressed. This is fairly simple, but it will add a check in every
   secondary `mousemove` trigger function.
   
2. Add a secondary trigger function to `mouseleave` to the root HTML element: `document.children[0]`.
   The purpose of this secondary trigger function is solely to guard against mouse-out-of-bounds 
   Jailbreak. Whenever the mouse leaves the scope of the DOM,
   this function will be called and the ongoing mouse-based gesture can be stopped.
   
The second solution is the best one. But sometimes, the app wants to give its users some slack 
and accept the mouse moving in and out of the browser or iframe window. In such instances, 
the first solution provides a good alternative.

## MouseJailbreak #2: secret button

Most computer mice has more than three mouse buttons. The second mouse button will most commonly 
trigger a context menu. What happens if the user either intentionally or by accident presses 
a second mouse button during an ongoing mouse-based gesture?

If, an extra `mousedown` event is dispatched during a mouse-based EventSequence, 
this should trigger the initial `mousedown` event trigger function a second time, 
while the EventSequence is already active. In such a situation, 
the mouse-based EventSequence developer has two options:

1. If the initial event trigger function is triggered *while the EventSequence is active*, 
   then cancel the EventSequence.

2. If an extra `mousedown` event is dispatched *while the EventSequence is active*,
   then call `.preventDefault()` on the extra `mousedown` event and simply continue the EventSequence.
   This approach require extra attention being made in the secondary `mouseup` event trigger function
   to ensure that the fingers-on-buttons conditions for ending the EventSequence is met.
   (This also applies to any and the second `mousemove` ) to ensure that not 

A good way to modularize this functionality is to make *two* event trigger functions:
one initial event trigger function that listens while the EventSequence is inactive, and 
one secondary event trigger for the *same* event that replaces the initial event trigger once the
EventSequence is activated.

## MouseJailbreak #3: stay alert!

A script triggers `alert(...)`, `confirm(...)` or similar is triggered. 
These functions disrupts the browser's focus and event system.

Such browser disruptions should almost always cancel ongoing EventSequences.
Such disruptions can be discovered using the `focusin` event.

//todo here we need to test different browsers.
//todo is it better to use `window.addEventListener("focusout", cancel, true)`?
//todo is it possible to do `document.children[0].addEventListener("blur", cancel, true)`?
//todo or `document.children[0].addEventListener("focus", cancel, true)`?
//todo what works in which browsers when alert and confirm is called?
//todo are there other functions such as selecting a file from a 

## Example: `long-press` in jail

To illustrate how a MouseJailbreak can be handled during an EventSequence, we put `long-press` in jail.

```javascript
var primaryEvent;                                               

function startSequenceState(e){                                 
  primaryEvent = e;                                     
  window.addEventListener("mouseup", onMouseup, true);             
  window.addEventListener("mouseleave", onMouseleave, true);          //[1]
  window.addEventListener("focusin", onFocusin, true);                //[3]
  window.addEventListener("mousedown", onMousedownSecondary, true);   //[2]
  window.removeEventListener("mousedown", onMousedownInitial, true);  //[2]
}

function resetSequenceState(){
  primaryEvent = undefined;                                     
  window.removeEventListener("mouseup", onMouseup, true);             
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
  primaryEvent.target.dispatchEvent(new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                       
}

function onMouseup(e){                                          
  var duration = e.timeStamp - primaryEvent.timeStamp;
  //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
  if (duration > 300 && e.target === primaryEvent.target)       
    primaryEvent.target.dispatchEvent(new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         
}

function onMouseleave(e){                                       //[1]
  primaryEvent.target.dispatchEvent(new CustomEvent("long-press-cancel", {bubbles: true, composed: true}));
  resetSequenceState();                                         
}

function onFocusin(e){                                          //[3]
  primaryEvent.target.dispatchEvent(new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration}));
  resetSequenceState();                                         
}

window.addEventListener("mousedown", onMousedown);              

//1. MouseJailbreak #1: out of bounds
//   A secondary trigger function for `mouseleave` on the root HTML element `document.children[0]`
//   that when triggered cancels the mouse-based EventSequence.
//2. MouseJailbreak #2: extra button
//   The initial trigger function for `mousedown` is disabled while the EventSequence is active.
//   A secondary trigger function is added for `mousedown` that will cancel the EventSequence if
//   the user intentionally or accidentally hits an extra mousebutton.
//3. MouseJailbreak #3: stay alert!
//   A secondary trigger function for `focusin` is added to cancel the EventSequence if there is any
//   change of focus during the EventSequence.


```

## Demo: `long-press` in jail
```html
<div id="one">
  Press me more than 300ms for a long-press.
  If you move the mouse cursor outside of the 
  scope of the window, while you press, 
  the long-press will be canceled.
  If you hit an extra mouse button while you press,
  the long-press will be canceled.
</div>

<div id="two">
  When you try to press me, I will trigger an alert after 600ms.
  This will cause the long-press to be cancelled if you hold it down for more
  than 600ms.
</div>

<script>
document.querySelector("#two").addEventListener("mousedown", function(){
  setTimeout(function(){
    alert("MouseJailbreak! Stay on the alert!");
  }, 600);
});

window.addEventListener("long-press", function(e){
  console.log("long-press", e);
});
window.addEventListener("long-press-cancel", function(e){
  console.log("long-press-cancel", e);
});
</script>
```

## References

 * 
 
