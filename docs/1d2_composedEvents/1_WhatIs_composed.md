# WhatIs: `composed`?

## WhatIs: external events?

External events represent **a state change of data outside of the DOM**. For example, a `keydown` event represents a state change of the user's finger, a change of the mouse buttons position, a primitive UI event in the OS; the `offline` event represents a state change in a cut network cable, a router loosing power, the OS loosing wifi connection. The event is a "sign of a state change", and external events represents state changes external to the DOM. 

External events can be relevant for any element anywhere in the DOM. And therefore, they should be accessible to all DOM layers. For example, a `click` is an external event that can be directed at elements in both the main *and* shadowDOM contexts. In an app, a `click` can `target` both a play button in the shadowDOM of a `<video>` element or a regular button in the main DOM. Another example is the `resize` event. When the `window` `resize`s, a reaction might be triggered that both control the layout of the control panel inside a `<video>` element or the content of the footer at the bottom of the main document. Therefore, the external `click` event needs to be accessible in all DOM contexts.

## HowTo: make external events accessible?

There are two mechanisms to make external events accessible from all DOM contexts:

1. `target` the `window` node which is accessible from all contexts. OS/browser-app events such as `resize` and `online` often do not `target` any particular element in the DOM. These elements therefore `target` the `window` node, and this makes them directly and equally readable from all DOM contexts, as the `window` node can be read from both the main DOM and shadowDOMs alike.

   When you `target` the `window`, you are able to access the event, but the scripts gets no support from the event propagation queue order for the event. This makes the event listeners hard to queue. Events that `target` the `window` makes the assumption that the order of the event listeners make no difference, and that mechanisms such as `stopPropagation()` that can turn on/off a subsequent cascade of event listeners for a particular event is not relevant for this type of event.  

2. Set `composed: true`. User-generated events such as `click` or `keypress` are `composed: true`. These events represents external state changes that is associated with a particular element in the DOM: the `target` is a particular element in the DOM. These particular elements might exist in different DOM contexts, and therefore they might not be accessible from other DOM contexts. Hence, the event needs to signify that it could be relevant for and therefore propagate in all DOM contexts with another mean, namely its `composed` property.

    `composed` is the name/property of events that describe if an event can travel across shadowDOM borders. If an event is `composed: true`, the event will propagate *down and up* going in and out of web components. If an event is `composed: false`, the event can *not* propagate *out of* a web component's shadowDOM, but are start at and are stopped at the `shadowRoot` ancestor of their `target`.

 * In my opinion, external events that `target` the `window` should be `composed: true`. In principle, `composed: true` better reflect the external state whose change they signify. However, it makes no difference if these events are `composed: true` or `composed: false` as they will only propagate to a single node anyway. And, the browser/spec runs a policy that all events are `composed: false` until a use-case proves otherwise. So, here we are.
 
We can easily create custom external events. For example, a news service server can receive a new news article, and this might be communicated to the app as a `new-news` event that `target` the `window`. Another example is an online chat app where a `new-msg` event `target` a specific chat window element, and propagate through all the chat apps DOM layers being `composed: true`. Or an tetris style game app might implement a set of multiple timers that generate `new-move` events where the app might like to keep track of all moves while at the same time be able to `target` different `new-move` events to different elements. If you need to `target` the external app-, server-, or timer-driven event at a particular element, then make them `composed: true`. If the external event does not `target` a particular element, `target` it at the `window`.    

## Event propagation for `composed: true` 

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

## Which events are `composed: true`?

Below is a list of all `composed: true` events:    

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
```

## WhatIs: internal events?

**Internal events** represent a state change of data in the DOM itself. The DOM consists of a series of elements and nodes, and many events are dispatched that alert of a change of a state of one such element and one of its properties. Examples of internal events are:
1. `change`: the value of an input element *has been* changed. The `change` event are sometimes dispatched only when the input element looses focus. The `change` event represent a state change of an input element.
2. `reset`: the `value` property (or equivalent) of potentially several input elements in a `<form>` *will be* changed. The `reset` event represent a state change internal to a group of elements clustered under a single `<form>` element *all within the same DOM context*.
3. `toggle`: the `open` property of a `<details>` element *has been* changed. 

Both internal and external events announce state changes that:
1. *has already occurred*, **past tense**, and 
.2 *will occur*, **future tense**.   

As a rule of thumb, events that alert about the change of state of an element are of interest only in the context of the local to the document/`shadowRoot` of that element. Internal events are `composed: false`. They `target` the element whose state has/will change, or a root element that contain a group of elements whose state has/will change.  

By default, the browser/spec flags all events as `composed: false`. The browser/spec does this to ensure that events are kept from flying around to other DOMs that do not need to know about it. Keeping events `composed: false` by default errors on the side of "non-confusion"/"non-leakage" which is better than defaulting to `composed: true` which would err on the side of "developer access". 

## Event propagation for `composed: false` 

Below is the propagation path for a `toggle` event on a `<details>` element that is inside the shadowDOM of a inner web component that in turn is inside the shadowDOM of another outer web component.

```
window
  outer-comp                
-------------------------------OuterComp-
|   shadowRoot                          |
|     inner-comp                        |
|     --------------------InnerComp-    |
|     | shadowRoot  \c/b           |    |
|     |   details    *             |    |
|     |     summary                |    |
|     ------------------------------    |
-----------------------------------------
  div#a
  div#b
```

## Which events are `composed: false`?

Below is a list of all `composed: false` events:    

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

The `composed: false` events only reflect a DOM state mutation. Therefore, they usually do not need to relay any information other than which DOM elements has/will change. As a web developer, you can therefore expect to only receive two pieces of information from an `composed: false` event: the event `type` name and the `target` element.
    
## References

 * 