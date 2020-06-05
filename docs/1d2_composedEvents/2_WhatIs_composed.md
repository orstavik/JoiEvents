# WhatIs: `composed`?

The events' `composed` property works as follows:
 * `composed: false`: restrains an event's propagation to the nearest shadowRoot node of the `target` (or the `window` if the event is in the main DOM context/`document`).
 * `composed: true`: enable an event's propagation to traverse the full propagation path from the `window` down through all DOM contexts until the `target` node.

Internal events, events that signify a state change in a DOM element (or element group), can be prevented from bleeding up and out into external DOM contexts by having a `composed: false` property.

External events, events that signify a state change from outside the DOM, can be made accessible to all DOM contexts using one of two mechanisms:
1. `target` the `window`
2. `composed: true`.

## `composed: false`

As a rule of thumb, internal events (ie. events that announce a state change of a DOM element (group)) are only of interest in the DOM context of that element. Internal events are therefore `composed: false`. They should `target` the element whose state has/will change (or a container element for a group of elements such as a `<form>`).

The `composed: false` events only reflect a DOM state mutation. Therefore, they usually do not need to relay any information other than which DOM elements has/will change. Often, `composed: false` contains no other data than its `type` name and `target` element.

The browsers set all events as `composed: false` by default. The browsers do this to ensure that events are kept from flying around to other DOMs that do not need to know about it. Keeping events `composed: false` by default errors on the side of "non-leakage" as opposed to "access", most likely because a) events developers make often announce an state change in a DOM element(s), and b) the lack of access quickly becomes apparent during development, while problems of events leaking might first become apparent in production. 

### Demo: `toggle` is `composed: false` 

Below is the propagation path for a `toggle` event on a `<details>` element that is inside the shadowDOM of a inner web component that in turn is inside the shadowDOM of another outer web component.

```
window
  outer-comp                
-------------------------------OuterComp-
|   shadowRoot                          |
|     inner-comp                        |
|     --------------------InnerComp-    |
|     | shadowRoot  \c/b           |    |  capture  bubble
|     |   details    *             |    |       target
|     |     summary                |    |
|     ------------------------------    |
-----------------------------------------
  div#a
  div#b
```

### ListOf: `composed: false` events

```javascript
const nonComposedEvents =[
  "change", "reset", "toggle",
  //submit alerts about a coming external state change (navigation/loading of a new document)
  //submit should be composed: true
  "submit",
  //focus events are composed, but often behave as/should be non-composed
  //"blur", "focus", "focusin", "focusout",
  //input events should be composed: false
  //"beforeinput", "input",
];
``` 

## `target`ing the `window`

The `window` object is globally available, accessible from both the main DOM `document` and any shadowDOM nested within that `document`. This makes it possible to call `window.addEventListener()` from any script and any web component. Therefore, when an external event `target`s the `window` node, the event is made accessible to all DOM contexts.

OS/browser-app events such as `resize` and `online` often do not `target` any particular element in the DOM. Therefore, these elements are free to `target` the `window` node.

The drawback of `target`ing the `window` is that you loose the ability to order eventlisteners by their DOM position. By setting the `target` to be an element in the DOM, not only event listeners associated with the `target` element are selected, but also the event listeners of any ancestor of that `target` within the propagation path. Furthermore, these event listeners are queued according to their position in this propagation path, and the queue can be dynamically controlled via `stopPropagation()`.

Thus, selecting an appropriate `target` gives the developer a means to create a complex queue system which remains relatively(!) intuitive, understandable, and manageable. And so, for external events that can sensibly be `target`ed to an element in the DOM, we would therefore like another mechanism than `target`ing the `window`. This mechanism is `composed: true`. 
 
## `composed: true`

User-generated events such as `click` or `keypress` are `composed: true`. These events represents external state changes that is associated with a particular element in the DOM: the `target` is a particular element in the DOM, and the event would loose a lot of information if it was made externally available by `target`ing the `window` instead.

However, these particular elements might exist in different DOM contexts, and therefore they might not be accessible from other DOM contexts. Hence, the event needs to signify that it could be relevant for and therefore propagate in all DOM contexts with another mean, namely its `composed` property.

`composed` is the name/property of events that describe if an event can travel across shadowDOM borders. If an event is `composed: true`, the event will propagate *down and up* going in and out of web components. If an event is `composed: false`, the event can *not* propagate *out of* a web component's shadowDOM, but are start at and are stopped at the `shadowRoot` ancestor of their `target`.

### Demo: `click` is `composed: true` 

Below is the propagation path for a `click` event on an `<a href>` element that is inside the shadowDOM of a inner web component that in turn is inside the shadowDOM of another outer web component.

```
window        \capture      /bubble
  outer-comp   \           /
----------------\---------/----OuterComp-
|   shadowRoot   \       /              |
|     inner-comp  \     /               |
|     -------------\---/--InnerComp-    |
|     | shadowRoot  \ /            |    |
|     |   a[href]    *target       |    |
|     ------------------------------    |
-----------------------------------------
  div#a
  div#b
```

### ListOf: `composed: true` events

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
  "cut", "copy", "paste",
  //focus events are partially composed, they cross shadowDOM borders, but not necessarily to the top DOM context
  "blur", "focus", "focusin", "focusout",
  //these five text input events should be composed: false, in my strong opinion
  "beforeinput", "input",
  "compositionstart", "compositionupdate", "compositionend",
  //this is a global event that alert about a coming change of the browser state that should be composed. It doesn't matter where the submit occurs, you want the DOM above to be able to intercept it.
  //"submit"
];
```

## Discussion

In my opinion, external events that `target` the `window` should be `composed: true`. It makes no difference if these events are `composed: true` or `composed: false` as they will only propagate to a single node anyway. But, `composed: true` better reflect the external state change that they signify. However, the browser/spec runs a policy is that all events are `composed: false` until a use-case proves otherwise. Therefore, external events that `target` the `window` are often marked as `composed: false`, even though they in principle resemble the `composed: true` UI events more than the `composed: false` internal events.
 
We can easily create custom external events. For example, a news service server can receive a new news article, and this might be communicated to the app as a `new-news` event that `target` the `window`. Another example is an online chat app where a `new-msg` event `target` a specific chat window element, and propagate through all the chat apps DOM layers being `composed: true`. Or a tetris-like game might implement a set of multiple timers that generate `new-move` events where the app might like to keep track of all moves while at the same time be able to `target` different `new-move` events to different elements. If you need to `target` the external app-, server-, or timer-driven event at a particular element, then make them `composed: true`. If the external event does not `target` a particular element, `target` it at the `window`.    
    
## References

 * 