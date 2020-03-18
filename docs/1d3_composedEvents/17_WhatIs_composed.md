# WhatIs: `composed`

When we make web components (or native elements with shadowDOM), the DOM actually gets broken off into multiple contexts which doesn't know nor care about each other. The main context is the main, topmost `document`. This is the dynamic DOM of the "app", the HTML being mutated by javascript that "normal" web developer makes.

However, there are other DOM contexts that are woven into the DOM that is presented to the user that is made by *other* developers. This is the shadowDOM contexts. The shadowDOM contexts are the inside of an HTML element, which also is made up of other HTML elements (and CSS and JS). You can think of it this way: at the outset, all element types are just simple `<span>` elements, but then they get filled with itsy-bitsy pieces of both HTML, CSS, and JS that make them unique. If you break elements up in this way, recursively, all you would be left with are `<span>` elements and JS and CSS code. More or less.

Now, it is obvious that we want to hide away these itsy-bitsy pieces of inner HTML structure,  javascript, and CSS code in the shadowDOM of a native element. For example, in a `<video>` element, we don't want the developer to access nor alter the structure, layout, and functions of the control panel: outside developers should only be able to tune, adjust and possibly select features for this control panel. The whole point of elements is exactly to hide those details to avoid the developer to tamper with them and get confused.

What is not so obvious, is that we also want to hide *events* that fly around inside the shadowDOM. If there are events that occur between two elements inside an element, we do not want to "disturb" the outside context with such inner events: we do not want inner event sequences to bleed out just as we don't want inner style nor functionality nor structure to bleed out of an element. Both HTML, CSS, JS *and events* should be encapsulated inside web components.   

By default, all events should be kept within the shadowDOM when they target an element inside the shadowDOM of another element; by default, all events are `composed: false` ("not composed"). `composed: true` is the name/property for events that can travel *up/down* and *in/out* of an element's shadowDOM. `composed: false` are all events that only propagate within shadowDOM borders, ie. local to the `shadowRoot` ancestor of their `target`. Keeping events `composed: false` prevent the flow of events inside an element from *bleeding* out and disturbing the flow of events in the "outer" contexts.  

## Which events are `composed`?

**`composed` events are *global***. They originate *outside* the DOM and then hit an element inside the DOM, both outside and inside the shadowDOM context. For example, a `click` on a play button in the shadowDom of a `<video>` element is a *global* event that hits an element deep inside the shadowDOM of an element in the DOM. Events that are *global* include:
1. user-generated events (`UIEvent`s such as `click` or `keypress`),
2. OS/browser-app events (commonly `target` the `window` node such as `resize` and `online`), and 
3. external custom events such as a custom app-specific or organization-specific, server-driven or state-driven event (which also commonly `target` the `window` or `document`).

In principal, all the native events listed above should be considered *global* and therefore *`composed`*. But, the browsers only mark the native events that might be targeted at an inner element with `composed: true`, so for example the `resize` and `online` events are still marked as `composed: false`.

Thus, currently, for native events only the user-driven events that can `target` elements down in the DOM are marked `composed: true`. Below is the full list of all these events set up as an array:    

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

As a rule of thumb, all events that alert about a **DOM state mutation** of an element are of interest only in the context of the local to the document/`shadowRoot` of that element. As a rule of thumb, all events that alert about a **DOM state mutation** of an element (or a group of elements) are `composed: false`.

Examples include:
`change`, `reset`, `toggle`

Examples of events that should be `composed: false`, but that are instead `composed: true`, is:
  `beforeinput`, `input`,

Examples of events that are `composed: false`, but should be `composed: true`, is:
  `submit`,
    
## References

 * 