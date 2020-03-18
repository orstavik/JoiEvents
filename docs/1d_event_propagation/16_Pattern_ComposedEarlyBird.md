# Pattern: ComposedEarlyBird

> gets another worm!

When a `composed: false` event is dispatched inside a `shadowRoot` inside a web component, then that event propagates down from the `shadowRoot` node, and *not* from the `window` node.

This means that:
1. in the **topmost, "main" lightDOM** all EarlyBird event listeners (ie. for both **composed** and **non-composed** events) are attached to the **`window`** node, but
2. **inside a shadowDOM**:
   * **composed** events on the **`window`** node, while
   * **non-composed** events on the **`shadowRoot`** node.
   
## Demo: A `composed: false` event inside a shadowDOM

In the demo below we add a simple web component with an `open` `shadowRoot` that contains a `<details>` element. We then add multiple event listeners to both the `window`, the host node, the `shadowRoot` and the `<details>` element, and then trigger the `toggle` event by turning the `open` property on the `<details>` element to `true`. 

```html
<script>

  class WebComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML =`
        <details>
          <summary>hello</summary>
          sunshine!
        </details>
      `;
    }
  }

  customElements.define("web-component", WebComponent);
</script>
<web-component></web-component>
<script>
  const webComponent = document.querySelector("web-component");
  const shadowRoot = webComponent.shadowRoot;
  const details = shadowRoot.children[0];

  //capture phase event listeners
  window.addEventListener("toggle", e=> console.log("window listener"), true);         //no, because the toggle event is non-composed
  webComponent.addEventListener("toggle", e=> console.log("host node listener"), true);//no, because the host node is not inside the shadowRoot
  shadowRoot.addEventListener("toggle", e=> console.log("shadowRoot listener"), true); //yes, this shadowRoot is the topmost target for this composed event

  //bubble phase event listeners
  details.addEventListener("toggle", e=> console.log("details listener bubble"));      //yes, the details is the target of the toggle event
  shadowRoot.addEventListener("toggle", e=> console.log("shadowRoot listener bubble"));//no, because the toggle event does not bubble.

  //trigger a toggle event from JS
  details.open = true;
</script>
```

The demo prints:
```
shadowRoot listener
details listener bubble
```

Explanation:
1. the `toggle` event is `composed: false`. This means that the event does not propagate outside the `shadowRoot` when its `target` element is located inside that element. Thus, no event listeners attached to the `window` nor the `details` host element is triggered, neither in the capture phase nor the bubble phase.    
2. the `toggle` event is `bubbles: false` too. This means that the event does not *bubble* up to the `shadowRoot` neither. Thus, do not forget to add `capture: true` for EarlyBird event listeners.  

## Problem 1: Which events are `composed: false`?

Principally, events should propagate in the *context* in which they occur, and that context only. For events that `target` an element in a DOM above the shadowDOM of a web component, this is not a problem because the event will never propagate into the shadowDOM. But, what about internal events inside a web component? If they propagated from the This is the  

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
```


## Problem 2: EarlyBirds for non-composed events in the `constructor()`

If you add two `<web-component>` elements in the example above, all the event listeners from the host node and down needs to be replicated in order to listen for `toggle` events inside the second element too. The best way to accomplish this, is to add the event listener for non-composed events in the `constructor()` of web components.

```html
<script>

  class WebComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <details>
          <summary>hello</summary>
          sunshine!
        </details>
      `;
      this.shadowRoot.addEventListener("toggle", e => console.log("shadowRoot listener from: ", this.id), true);
    }
  }

  customElements.define("web-component", WebComponent);
</script>
<web-component id="one"></web-component>
<web-component id="two"></web-component>
<script>
  //trigger a toggle event from JS
  document.querySelector("web-component#one").shadowRoot.children[0].open = true;
  document.querySelector("web-component#two").shadowRoot.children[0].open = true;
</script>
```
Results in:
```
shadowRoot listener from:  one
shadowRoot listener from:  two
```

## Problem 3: Adding essentially the same event listener to the `window` element.


## Listening for `composed` events from inside a shadowDOM

The scenario is as follows. You are declaring a web component. And you need to add an EarlyBird event listener.

1. You do not want to add this EarlyBird event listener for all the instances of your web components, ie. one for each element. EarlyBird event listeners always run, they are not filtered based on the propagation path of the event instance, and therefore you should not have more    

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