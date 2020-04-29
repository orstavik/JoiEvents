# WhatIs: propagation root?

The "propagation root" is the root node of the DOM context in which an event propagates, ie. the `window` or a `shadowRoot`. The general algorithm the browser uses for finding the propagation root is simple enough:
* `composed: true` events: `window`.  
* `composed: false` events: `shadowRoot` of the `target` element, or the `window` if the `target` element is in the main DOM.  

But, as always, there is an exception: the focus events (`focus`, `focusin`, `focusout`, and `blur`). The focus events are only half `composed: true`. They are `composed: true` in the sense that they can cross shadowDOM borders; but they are `composed: false` in the sense that their propagation root can be a `shadowRoot`.

## WhatIs: global events?

Global events are event types whose propagation root is *always* the `window`, ie.:
1. all `composed: true` events (except `focus`, `focusin`, `focusout`, and `blur`).
2. all events whose `target` is always the `window`, such as `resize`, `online`, `offline`, `message`, +++.

To query if an event is global, the following static function can be used:
```javascript
const composedEvents =[
  //these events should be composed
  "click", "auxclick", "contextmenu", "dblclick",
  "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup",
  "wheel",
  "keydown", "keyup",
  "touchstart", "touchend", "touchmove", "touchcancel",
  "pointerover", "pointerenter", "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerout", "pointerleave",
  "gotpointercapture", "lostpointercapture",
  "dragstart", "dragend", "dragenter", "dragexit", "dragleave", "drag", "dragover", "drop",
  "compositionstart", "compositionupdate", "compositionend",
  "cut", "copy", "paste",
  //focus events are composed, but often behave as non-composed
  "blur", "focus", "focusin", "focusout",
  //these two events should not be composed, in my opinion
  "beforeinput", "input",
  //this is a global event that alert about a coming change of the browser state that should be composed. It doesn't matter where the submit occurs, you want the DOM above to be able to intercept it.
  //"submit"
];
const focusEvents = ["blur", "focus", "focusin", "focusout"];
const windowTargetEvents =["resize", "online", "offline", "message"];
function isGlobalEvent(eventType){
  return focusEvents.indexOf(eventType) === -1 && ( 
         composedEvents.indexOf(eventType)!== -1 || 
         windowTargetEvents.indexOf(eventType) !== -1);
}
```

## WhatIs: local events?

Local events are events that are not global, ie.
 * the focus events,
 * `composed: false` events that do not `target` the `window`.
 
But. Local events *can* still have the `window` as their propagation root. All local events that propagate through the main DOM will have the `window` as their propagation root; local events that are restricted to a shadowRoot will have that shadowRoot as their propagation root.

## References

 * [discussion about closed shadowDOM intention](https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975)