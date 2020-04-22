# WhatIs: slotted events?

When an element is slotted into a web component, a strange circumstance occur: 
 * the propagation path will cross *down into* the shadowDOM border, 
 * for both `composed: false` and `composed: true` events.
  
This means that events can trigger event listeners inside a shadowDOM that is positioned at a lower level than the original `target` element. When an event is sent to event listeners *down inside* another shadowDOM context via a `<slot>`, we call it a "slotted event".

## Demo: slotted events

```html
<script>
  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<slot></slot>`;
      shadow.children[0].addEventListener("click", e => console.log("2 shadowDOM bubble: slot"));
      shadow.addEventListener("click", e => console.log("3 shadowDOM bubble: shadowRoot"));
    }
  }

  customElements.define("closed-comp", ClosedComp);
</script>

<closed-comp>
  <h1>Remember, your shadow is your only companion.</h1>
</closed-comp>

<script>
  const h1 = document.querySelector("h1");
  const closed = document.querySelector("closed-comp");
  h1.addEventListener("click", e => console.log("1 lightDOM at target"));
  closed.addEventListener("click", e => console.log("4 lightDOM bubble"));
</script>
```

Results in:

```
1 lightDOM at target
2 shadowDOM bubble: slot
3 shadowDOM bubble: shadowRoot
4 lightDOM bubble
```

The event is "slotted" when it is passed to the event listeners inside the ShadowDOM. 

## Function: `isSlottedEvent(event)`

To detect if an event listener is called on a slotted event, ie. if an event listener inside a DOM context that is lower than the DOM context of the innermost `target` is currently being invoked, we check if *the `.currentTarget` has propagated into more shadowDOMs via `<slot>` elements than it has yet to propagate out of. Technically, this is achieved by counting `<slot>` elements stepped into against subsequent `ShadowRoot`s stepped out of in the propagation path.
 
```javascript
function isSlottedEvent(event){
  let slots = 0;
  for (let target of event.composedPath()) {
    if (target === event.currentTarget)
      return slots > 0;
    if (target instanceof HTMLSlotElement)
      slots++;
    if (slots > 0 && target instanceof ShadowRoot)
      slots--;
  }
  throw new Error("isSlottedEvent(event) should only be called on an event during propagation.");
}
//this method will not work with the web component polyfill.
```

## References

 *