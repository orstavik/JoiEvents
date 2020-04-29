# WhatIs: slotted events?

When an element is slotted into a web component, a strange circumstance occur: 
 * the propagation path for events that `target` the slotted element will cross *down into* the shadowDOM border, 
 * for both `composed: false` and `composed: true` events.

A "slotted event" is an event that is *currently* propagating/sent into another shadowDOM context via a `<slot>`. This shadowDOM will have a lower DOM context than the DOM context of the original, innermost `target`. Both `composed: false` and `composed: true` events can be slotted events (yes, you heard right! **`composed: false` events can cross shadowDOM borders going *down* into a `<slot>`**). When the same event is propagating in the DOM context of the slotted element `target` (the events original DOM context) or a DOM context above, we do not refer to the event as being slotted.

## Demo: slotted events

```html
<script>
  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<slot></slot>`;
      shadow.children[0].addEventListener("composed-false", e => console.log("2 shadowDOM bubble: slot"));
      shadow.addEventListener("composed-false", e => console.log("3 shadowDOM bubble: shadowRoot"));
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
  h1.addEventListener("composed-false", e => console.log("1 lightDOM at target"));
  closed.addEventListener("composed-false", e => console.log("4 lightDOM bubble"));

  h1.dispatchEvent(new CustomEvent("composed-false", {composed: false, bubbles: true}));
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

```
original DOM context

1) h1 ->                             4) closed-comp
---------------------------------------------------
         2) slot -> 3) shadowRoot ->

slotted event context      
```

## Function: `isSlottedEvent(event)`

To detect if an event listener is called on a slotted event, ie. if an event listener inside a DOM context that is lower than the DOM context of the innermost `target` is currently being invoked, we check if *the `.currentTarget` has propagated into more shadowDOMs via `<slot>` elements than it has yet to propagate out of. Technically, this is achieved by counting `<slot>` elements stepped into against subsequent `ShadowRoot`s stepped out of in the propagation path.
 
```javascript
//the instanceof check in this function does not work with the web component polyfill.
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
```

The use-case for `isSlottedEvent(event)` is fairly simple:
1. `isSlottedEvent(event)` should be used by **all** "slotted event listeners". A "slotted event listener" is any event listener that *might* intercept slotted events, ie. event listeners that are added to a) a `<slot>` element  inside a shadowRoot or b) an ancestor of such a `<slot>` element. This means that *all* `this.shadowRoot.addEventListener(...)` calls inside a shadowDOM with a `<slot>` should include it.
2. if `isSlottedEvent(event)` returns `true`, the event listener should abort. This means that all "slotted event listeners" should begin with the same check to abort:

```javascript
this.shadowRoot.addEventListener("any-event-type", function(e){
  if(isSlottedEvent(e))
    return;
  //here goes the code for your normal event listener

}, true||false);
```

## Demo: isSlottedEvent(...)

This demo nests two `<slot>` elements in order to test the `isSlottedEvent(event)` function. 

```html
<script>
  (function () {

    function isSlottedEvent(event) {
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

    class OuterComp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<inner-comp><slot></slot></inner-comp>`;
        shadow.children[0].addEventListener("custom-event", function (e) {
          if (isSlottedEvent(e))
            return;
          console.log("4 shadowDOM bubble: slot");
        });
        shadow.addEventListener("custom-event", function (e) {
          if (isSlottedEvent(e))
            return;
          console.log("5 shadowDOM bubble: shadowRoot");
        });
      }
    }

    customElements.define("outer-comp", OuterComp);

    class InnerComp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<slot></slot>`;
        shadow.children[0].addEventListener("custom-event", function (e) {
          if (isSlottedEvent(e))
            return;
          console.log("2 shadowDOM bubble: slot");
        });
        shadow.addEventListener("custom-event", function (e) {
          if (isSlottedEvent(e))
            return;
          console.log("3 shadowDOM bubble: shadowRoot");
        });
      }
    }

    customElements.define("inner-comp", InnerComp);

    class WebComp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<h1>You are your shadow's shadow.</h1>`;
        this.innerElement = shadow.children[0];
        this.innerElement.addEventListener("custom-event", function (e) {
          if (isSlottedEvent(e))
            return;
          console.log("1a shadowDOM bubble: slot");
        });
        shadow.addEventListener("custom-event", function (e) {
          if (isSlottedEvent(e))
            return;
          console.log("1b shadowDOM bubble: shadowRoot");
        });
      }
    }

    customElements.define("web-comp", WebComp);
  })();
</script>

<outer-comp>
  <h1>Remember, your shadow will leave you in the dark.</h1>
  <web-comp></web-comp>
</outer-comp>

<script>
  const h1 = document.querySelector("h1");
  const web = document.querySelector("web-comp");
  const outer = document.querySelector("outer-comp");
  h1.addEventListener("custom-event", e => console.log("1 lightDOM at target"));
  web.addEventListener("custom-event", e => console.log("1c lightDOM at target"));
  outer.addEventListener("custom-event", e => console.log("6 lightDOM bubble"));

  h1.dispatchEvent(new CustomEvent("custom-event", {composed: false, bubbles: true}));
  console.log("--------")
  web.innerElement.dispatchEvent(new CustomEvent("custom-event", {composed: true, bubbles: true}));
</script>
```

This demo illustrates how the `isSlottedEvent(..)` function:
 * separates between a) slotted event listeners and b) event listeners that are associated with elements inside a shadowRoot, and
 * is necessary for both `composed: true` and `composed: false` events. 

## Discussion: can slotted events also bounce?

Can slotted events also bounce, ie. be queued to propagate *after* or *before* the original event? 

   The problem is defaultActions. How should that be interpreted?

demo 1: set up a web comp that gets slotted in a `<a href>`. this web comp puts the `<a href>` inside a `<details> <summary>`. The link from the lightDOM should set the defaultAction first.
   
demo 2: set up a web comp with a `<details> <summary>`. It gets slotted in a `<h1>`. But, outside in the lightDOM, the web comp is wrapped inside an `<a href>`. The summary from the shadowDOM should hold set the defaultAction first.
   
Running slotted events in the flattened DOM structure seems hard to avoid. Slotted events are not associated with composed: true or false; on the contrary, they are explicitly both composed: true and false. So, it might make sense that they cannot bounce, as they have nothing to do with composed: true.

Slotted events can't bounce?  

## References

 *