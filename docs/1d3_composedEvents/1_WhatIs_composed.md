# WhatIs: `composed`

## Why shadowDOM?

With web components the DOM actually gets broken off into multiple contexts which doesn't care about each other. First, there is the **main DOM context**: the "normal DOM" that "normal" web developer makes; the main topmost `document`; the app's HTML that is changed by the app's javascript. Second, there are the **shadowDOM contexts**: small pieces of DOM inside web components (and native elements) that contain their own, separate HTML, JS, and CSS; small pieces of DOM that are nested into the main DOM and each other; potentially reusable web components that do not know the context of the main DOM, nor each other, and whose insides the main DOM should not need to worry about; web components made by other developers.

The shadowDOM contexts are the inside of an HTML element. The inside of an element is made up of other HTML elements, some added CSS style and some custom JS properties, methods, and reactions. If you analyze a piece of HTML template to its roots, you would break it down into layers upon layers of shadowDOM with gradually simpler elements with some CSS and JS until you end up with a shadowDOM that only contain simple `<span>` elements with some added JS and CSS. More or less.

Now, it is obvious that we want to hide away these itsy-bitsy pieces of inner HTML structure,  javascript, and CSS code in the shadowDOM of a native element. First, it would be impossibly complex if web developers had to work only with the low level `<span>` elements and lots of CSS and JS code. Second, we want to encapsulate in structure, layout, and functions of many different elements to prevent styles, functions and structures from mixing up. For example, it is good to not expose all the template, functions, and style of the control panel in a `<video>` element, as it would both swamp the code where the `<video>` element is used and potentially leak both in and out style and functionality. The whole point of web components and HTML elements is this: to hide generic stylistic, structural and functional details to prevent them from confusing the developer and get their references mixed up with the rest of the code where it is used. *The purpose of web components (and native elements) is to encapsulate HTML, CSS, and JS*.  

But, we forgot one thing! We forgot that we also want to **encapsulate internal events**. Web components (and native elements) can have lots of events flying around inside their shadowDOM that are internal details, that has nothing to do with the elements outside. It can be just as important to hide and shield internal events as it is to hide and shield internal style and functionality. Some events therefore needs to be contained inside the shadowDOM context, while other events should be able to fly between shadowDOMs. We do not want the inner event sequences of an element to bleed out from an element (and we don't want irrelevant outer event sequences  to bleed into an element's insides neither). *The purpose of web components (and native elements) is to encapsulate HTML, CSS, JS, **and events***.  
 
## Which events are `composed`?

**External events**. External events represent *a state change that occur outside of the DOM*. For example, a `keydown` event represents a state change of the user's finger, a change of the mouse buttons position, a primitive UI event in the OS; the `offline` event represents a state change in a cut cable, a router loosing power, the OS loosing wifi connection. 

External events can be relevant for any element anywhere in the DOM. And therefore, they should be accessible to all DOM layers. For example, a `click` is an external event that can be directed at elements in both the main *and* shadowDOM contexts. In an app, a `click` can `target` both a play button in the shadowDOM of a `<video>` element or a regular button in the main DOM. Another example is the `resize` event. When the `window` `resize`, a reaction might be triggered that both control the layout of the control panel inside a `<video>` element or the content of the footer at the bottom of the screen. Therefore, the external `click` event needs to be accessible in all DOM contexts.

There are two mechanisms to make external events accessible from all DOM contexts:
1. `target` the `window` node which is accessible from all contexts. OS/browser-app events such as `resize` and `online` often do not `target` any particular element in the DOM. These elements therefore `target` the `window` node, and this makes them directly and equally readable from all DOM contexts, as the `window` node can be read from both the main DOM and shadowDOMs alike. 

2. set `composed: true`. `composed` is the name/property of events that describe if an event can travel across shadowDOM borders. If an event is `composed: true`, the event will propagate *down and up* going in and out of web components. If an event is `composed: false`, the event can *not* propagate *out of* a web component's shadowDOM, but are start at and are stopped at the `shadowRoot` ancestor of their `target`.

   User-generated events such as `click` or `keypress` are `composed: true`. These events represents external state changes that can be directed at a particular element in the DOM. As the `target` here needs to be addressed at a particular element in the DOM, the event needs to signify using some other means (ie. the `composed` property) that it can and will propagate in all DOM contexts.

 * In my opinion, external events that `target` the `window` should be `composed: true`. In principle, `composed: true` better reflect their external origin and target. However, it makes no difference if these events are `composed: true` or `composed: false` as they will only propagate to a single node anyway. The browser/spec runs a policy that all events are `composed: false` until a use-case proves otherwise, and so here we are.
 
We can easily create custom external events. For example, a news service server can receive a new news article, and this might be communicated to the app as a `new-news` event that `target` the `window`. Another example is an online chat app where a `new-msg` event `target` a specific chat window element, and propagate through all the chat apps DOM layers being `composed: true`. Or an tetris style game app might implement a set of multiple timers that generate `new-move` events where the app might like to keep track of all moves while at the same time be able to `target` different `new-move` events to different elements. If you need to `target` the external app-, server-, or timer-driven event at a particular element, then make them `composed: true`. If the external event does not `target` a particular element, `target` it at the `window`.    

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

## Which events are `composed: false`?

**Internal events** represent a state change in the DOM itself. The DOM consists of a series of elements and nodes, and many events are dispatched that alert of a change of a state of one such element and one of its properties. Examples of internal events are:
1. `change`: the value of an input element *has been* changed. The `change` event are sometimes dispatched only when the input element looses focus. The `change` event represent a state change of an input element.
2. `reset`: the `value` property (or equivalent) of potentially several input elements in a `<form>` *will be* changed. The `reset` event represent a state change internal to a group of elements clustered under a single `<form>` element *all within the same DOM context*.
3. `toggle`: the `open` property of a `<details>` element *has been* changed. 

Both internal and external events announce state changes that:
1. *has already occurred*, **past tense**, and 
.2 *will occur*, **future tense**.   

As a rule of thumb, events that alert about the change of state of an element are of interest only in the context of the local to the document/`shadowRoot` of that element. Internal events are `composed: false`. They `target` the element whose state has/will change, or a root element that contain a group of elements whose state has/will change.  

By default, the browser/spec flags all events as `composed: false`. The browser/spec does this to ensure that events are kept from flying around to other DOMs that do not need to know about it. Keeping events `composed: false` by default errors on the side of "non-confusion"/"non-leakage" which is better than defaulting to `composed: true` which would err on the side of "developer access". 

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

## In this chapter:

1. BounceEvent: a pattern for making `composed: false` "bounce up" and propagate in the above lightDOM when necessary. 
2. Problem: Why should the `submit` event be `composed: true`?
3. Problem: Why should `beforeinput` and `input` events be `composed: false`?
4. Problem: Why do focus events sometimes behave as though they are `composed: false`, when they are always `composed: true`? Are focus events in reality automatically bounced by the browser?
5. Problem: Why should `composed: false` events *not* propagate down into "lower shadowDOMs"? Should nodes in the propagation path that do not have the same document root as the `target` be removed from the propagation path of `composed: false` events?

> There is a problem that `composed: false` events are allowed to propagate *down into* the shadowDOM border when their `target`s are slotted. We will return to this problem soon. 
    
## References

 * 