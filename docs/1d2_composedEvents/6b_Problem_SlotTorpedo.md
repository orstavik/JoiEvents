# Problem: SlotTorpedo 

Slotted events propagate down into a lower shadowDOM. Both `composed: true` and `composed: false` events can be slotted.

If you call `.stopPropagation()` on a slotted event, this will stop the propagation of the event. But, the slotted event callbacks occur *during* the capture or bubble phase of the event's propagation in the lightDOM. Thus, the call to `.stopPropagation()` from a slotted event context will essentially make an event disappear midway through a propagation phase of the lightDOM, without any notice.

## Demo: SlotTorpedo

```html
<closed-comp>
  <h1>Remember, your shadow is your only true companion.</h1>
</closed-comp>

<script>
  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "closed"});
      shadowRoot.innerHTML = `<slot></slot>`;
      shadowRoot.addEventListener("composed-false", e => e.stopPropagation());  //SlotTorpedo
    }
  }

  customElements.define("closed-comp", ClosedComp);

  const h1 = document.querySelector("h1");
  const closed = document.querySelector("closed-comp");
  h1.addEventListener("composed-false", e => console.log("If you say A,"));
  closed.addEventListener("composed-false", e => console.log("you must say B!")); //Where did the composed-false event go?!?!
  h1.dispatchEvent(new CustomEvent("composed-false", {composed: false, bubbles: true}));
</script>
```

Result:
```
If you say A,
```

It doesn't `say B!`. But why?
 
The reason is that the `composed-false` event propagates down into the `shadowRoot` of `<closed-comp>` via the `<slot>` element. We can view the flattened DOM and the real propagation path of the `composed-false` event like this:

```
The flattened DOM and propagation path:
=======================================
  closed-comp      \     -  (event listener: "you must say B!")
    $shadowRoot     \   *  (event listener: .stopPropagation())   /*SlotTorpedo*/
       $slot         \ /
         h1           *  (event listener: "If you say A,")
```

The problem is that the inner workings of the `<closed-comp>` element should be hidden from the lightDOM context. This means that the DOM and the expected propagation path from the point of view of the lightDOM developer looks like this: 

```
The expected propagation path in the lightDOM:
==============================================
  closed-comp   \ *   (event listener: "you must say B!")  //Why doesn't this listener run?!?!
    h1           *   (event listener: "If you say A,")
```

## SlotTorpedoes are bad.

Very bad. And here is why:

SlotTorpedoes are most likely unexpected for both the shadowDOM and the lightDOM developer:
 * The shadowDOM developer is likely not intending to call `.stopPropagation()` on the slotted event, but confuses it with a similar element inside its shadowDOM.
 * The lightDOM developer is likely caught completely by surprise as even `composed: false` events (events that should only propagate in his own DOM context), suddenly disappears midway through either the capturing or bubbling phase.
 
Fortunately, SlotTorpedoes is just a subset of ShadowTorpedoes, and so the same solution that applies to ShadowDOM torpedoes applies to SlotTorpedoes:

> Never call `.stopPropagation()` on `composed: true` events inside a shadowDOM
>
> Never call `.stopPropagation()` on `composed: false` events inside a shadowDOM unless:
> * `isSlottedEvent(event)` returns `false`, and
> * if that event might be slotted (ie. `.stopPropagation()` must be called after `isSlottedEvent(event)` returns `false` or if there is no `<slot>` descendants of the event listeners event target node.   

## References

 * dunno