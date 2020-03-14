# Pattern: ComposedEarlyBird

> gets another worm!

When a `composed: false` event is dispatched inside a `shadowRoot` inside a web component, then that event only propagates down from the `shadowRoot` node, and *not* from the `window` node.
 
This produce the following scenarios. To intercept events directed at:
1. a DOM node in the **topmost, "main" lightDOM** you can intercept both **composed** and **non-composed** events on the **`window`** node,
2. a DOM node inside a `shadowRoot` you must intercept:
   1. **composed** events on the **`window`** node, while
   2. **non-composed** events on the **`shadowRoot`** node.
   
> All EarlyBird event listeners in the "main" document should listen on the `window` element. This chapter *only* discuss strategies needed when event listeners are added from a) multiple js modules and b) for `composed` events dispatched to/from nodes *under* a `shadowRoot` (inside a web component).

## Problem 1: Listening for the same thing from two places
 
Imagine the following scenario. You make two different web components. They both need the same reaction to a `UIEvent` that `composed` and therefore begins its propagation (in the `capture` phase) from the `window` down. And, these two web components can be used both together *and* individually. How do you prevent your web components from *both* adding the same event listener function to the `window` element (which would make a task you only need one instance of run twice)?

Answer: add a global property on the `window` that lets other modules know that a reactive ability to a `composed` `UIEvent` is active.

```javascript

```    

Furthermore, if you try to intercept *all* events of a certain type, and they are all first dispatched via the same `window` object, then *only one* event listener should be on the `window` element. If several different sources in your app all wish to implement the same listener on the `window` object, then this yields the problem of ensuring that two functions performing the same action is not registered twice. The `customElements.define(...)` manages a similar problem. 

When you need to intercept *all* event listeners for `composed` events inside a `shadowRoot`, then you need to add an event listener for those events for each `shadowRoot` object. This is fairly unproblematic, as this can often be done inside the `constructor()` of the web component.

If you need to intercept *all* event listeners for **non-composed** events from within a web component, you must *not* do so in every constructor, as this would yield multiple events. However, if you are not instantiating any elements, you do not want to have the event listener active. Thus, for elements always present in the DOM, then you would want to add the EarlyBird event listener next to the definition of the web component inside the JS module, and ensure that this event listener function is not added multiple times from multiple modules. Second, if the event listener is heavy, and the event element is often not connected in the DOM, then you would want to do the same as above, except turn on/off the event listener from `connectedCallback()`/`disconnectedCallback()` using a registry/counter that ensures that when two elements are connected and one element disconnected, the listener is not removed as there is still one element connected.

To find out which strategy is needed, a list of all `composed` events' names is set up. Then, either manually or checking with this registry, the EarlyBird event `target` of a given node can be identified:

```javascript
const composedEvents =[
"blur",
"focus",
"focusin",
"focusout",
"click",
"auxclick",
"contextmenu",
"dblclick",
"mousedown",
"mouseenter",
"mouseleave",
"mousemove",
"mouseout",
"mouseover",
"mouseup",
"wheel",
"beforeinput",
"input",
"keydown",
"keyup",
"compositionstart",
"compositionupdate",
"compositionend",
"touchstart",
"touchend",
"touchmove",
"touchcancel",
"pointerover",
"pointerenter",
"pointerdown",
"pointermove",
"pointerup",
"pointercancel",
"pointerout",
"pointerleave",
"gotpointercapture",
"lostpointercapture",
"dragstart",
"dragend",
"dragenter",
"dragexit",
"dragleave",
"drag",
"dragover",
"drop"
];

function earlyBirdTarget(eventName, node){
  //todo this method require lots of work.
  return composedEvents.indexOf(eventName)>=0 ? node.defaultView : node.host || node.defaultView ;
}
```

## Demo: addEarlyBird event listener inside web component
## References

 * 