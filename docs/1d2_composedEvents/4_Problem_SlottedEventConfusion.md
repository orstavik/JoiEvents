# Problem: SlottedEventConfusion

## WhatIs: shadowRoot listeners?

When you develop a web component, you often attach event listeners to the top shadowRoot instead of a more specific node down in the shadowDOM. We can call them "shadowRoot listeners". Why should we anticipate such shadowRoot listeners?
 
1. ShadowDOMs should be small. And they encourage the developer to view them in isolation. Therefore, most often, it can look like there is only one potential source for one event type. For example, it may appear that there is only one element in the shadowDOM that can be the `target` of an `input` or `change` event.

2. shadowRoot listeners are easy to write and require less boilerplate code than more specific alternatives: `this.shadowRoot.addEventListener(...)` is simpler to write and read than `this.shadowRoot.children[1].children[2].addEventListener(...)` or `this.shadowRoot.querySelector("selector").addEventListener(...)`.   

## Multiple, unrelated sources for the same type of events cause confusion

But, shadowDOMs that contain `<slot>` elements can also produce slotted events. Of all types, both `composed: true` and `composed: false`.

In such shadowDOMs, any shadowRoot listener (or any other event listener attached to an ancestor node of a `<slot>` element) might be triggered by the slotted events too. It is as if unexpected events are leaking down into the shadowDOM from the above lightDOM.

## Demo: SlottedEventConfusion

```html
<closed-comp>
  <div>
    light DOM
    <input type="checkbox">
  </div>
</closed-comp>

<script>
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

  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `
        shadowDOM <input type="checkbox">
        <slot></slot>
      `;
      this._checkBox = shadow.children[0];

      shadow.addEventListener("change", e => {
        console.log("how can this be true? ", e.target.checked);
        console.log("when this is false? ", this._checkBox.checked);
        console.log("because the event is slotted? ", isSlottedEvent(e));
      });
    }
  }

  customElements.define("closed-comp", ClosedComp);

  document.querySelector("input").click();
</script>
```

Results in:
```
how can this be true?  true
when this is false?  false
because the event is slotted?  true
```

In the demo above, a slotted `change` event propagates down into a `closed` `shadowRoot`. The flattened DOM and the real propagation path looks as follows:

```
             capture   bubble
closed-comp       \     /     
  $shadowRoot      \   /     
    $input#shadow      
    $slot           \ /             '$' marks elements inside ClosedComp shadowDom 
      input#light    * target

propagation path for change (composed: false)
 [window, document, closed-comp, $shadowRoot, $slot, input#light]
```

But. Viewing the shadowDOM of `ClosedComp` in isolation, the sources of `change` events appear only to be the `input#shadow` element:

```
 --------- ClosedComp -
 | shadowRoot         |
 |   input#shadow     |
 |   slot             |
 ----------------------
``` 

This causes confusion. From the shadowDOM perspective, `change` events would likely only occur from the `<input id="shadow">` element. The developer is likely to think that `<slot>` elements only dispatch `slotchange` events, because that is the only event that it really needs. But. In reality, the `<slot>` is an event joker. `<slot>` can emit almost any event, bubbling or not, composed or not (the only exception are events that only target the `window`).

The developer of `ClosedComp` can be excused for missing the situations when a `change` event is slotted into the shadowDOM.

## AlternativeTo: slotted events?

Slotted events are bad. From the perspective of the lightDOM, slotted events is a source of SlotTorpedoes and unexpected state changes in between event listeners in the same phase in the same DOM scope. From the perspective of the shadowDOM, slotted events might trigger shadowRoot listeners that were intended for internal events only. But, are slotted events a necessary evil?

To answer this question, we need to review the alternative. The alternative to listening for slotted events is a **host node listener**. A host node listener is an event listener that the web component adds/removes/controls on its host node. By adding host node listeners instead, all slotted event listeners can in principle be excluded. But, is this strategy any better? Are host node listeners a lesser evil than lotted event listeners? 
 
Host node event listeners have several mayor drawbacks:
1. A host node listener will receive *all* the events a slotted event listener would receive, and then some. In addition to all the slotted events (both `composed: false` and `composed: true`), a host node element would also receive events from elements that could be slotted, but isn't because their `slot="nameX"` attribute doesn't match any active `<slot name="nameX">` in the shadowDOM. So, host node listeners would not reduce any conflicts.
2. A host node listener would not be given access to the full `.composedPath()`. This means that the host node listener would not be able to distinguish which `<slot>` route the event will pass by. Thus, host node event listeners would need to do a manual search of the propagation path to distinguish between named `<slot>` elements.
3. A host node listener would not be able to distinguish between different elements inside the shadowDOM. This means that if the `<slot>` element is wrapped inside a `<div>`, a host node listener would receive the event, but not be able to sequence event listeners using the internal shadowDOM structure.

Thus. Host node listeners are worse than slotted event listeners, in most use-cases. However, slotted event listeners are still bad. So: be careful; use `isSlottedEvent(event)` to distinguish between slotted events and other internal events when you need it; and avoid shadowRoot listeners if they might catch unexpected slotted events (ie. do not add event listeners above a `<slot>` element in the shadowDOM if you don't know what you are doing).

## References

 * dunno