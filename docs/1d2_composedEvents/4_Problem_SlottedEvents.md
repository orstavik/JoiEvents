# Problem: SlottedEvents 

When an element is slotted into a web component, a strange circumstance occur: the propagation path will cross *down into* the shadowDOM border, both for `composed: false` and `composed: true` events, and trigger event listeners on elements that are positioned at a lower level than the `target` element. Events that propagate *down into* another shadowDOM context when a `target` element we call SlottedEvents.

SlottedEvents cause two problems:

1. **ShadowDOM event torpedo**. `.stopPropagation()` and `.preventDefault()` *mutates an event's propagation*. If a web component listens for an event on one of its `<slot>` node, or one of these nodes ancestors (including `this.shadowRoot` or equivalent), then these event listeners would be triggered by events dispatched on any `target` element slotted into web component. And if that event listener happens to call `.stopPropagation()` and `.preventDefault()`, then the propagation of that slotted event would be mutated.
 
    Such a mutation would effectively be invisible from the outside lightDOM in which the `target` reside. Hence, the mutation of the event's propagation would be unexpected, a torpedo from the shadows, for the developer who otherwise controls both the `target` element and the host node of the web component the `target` is slotted into. This problem is escalated by the fact that `.stopPropagation()` and `.preventDefault()` might only be called in some rare circumstances/states of the web component or DOM. These circumstances might not occur during development, but only in production, thus causing freak, edge case errors. The worst kind. The ShadowDomTorpedo demo illustrate this.

2. **SlotLeakingEvents**. When you develop a web component, you often attach event listeners to `this.shadowRoot` instead of the actual element in the shadowDOM. This practice would require less boilerplate code (ie. your web component JS would not be filled with `this.shadowRoot.children[1].children[2]` or `shadow.querySelector("select")`).

   But, if your shadowDOM also contains a `<slot>` element, then these event listeners would also be triggered by events stemming from slotted elements. These SlottedEvents could trigger the web component's inner event listeners that were only intended for internal events in the web component. Events leaking *down from the lightDOM* into the shadowDOM are not only bad because they can be torpedoed, it is also bad because the leaking event might trigger internal functions in the shadowDOM that were intended for internal events only. The second demo SlottedEventConfusion illustrate this.
   
Thus, slotted events are bad from both the perspective of the lightDOM (the slotted event could be torpedoed) and from the perspective of the shadowDOM (the slotted event might trigger event listeners intended for shadowDOM elements only). 

## Demo: ShadowDomTorpedo

```html
<open-comp>
  <input type="checkbox">
</open-comp>

<script>
  class OpenComp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<slot></slot>`;
      this.shadowRoot.addEventListener("click", e => {
        console.log("shadowDOM torpedo: calling e.stopPropagation() and e.preventDefault() on event from slotted target.");
        e.stopPropagation();
        e.preventDefault();
      });
    }
  }

  customElements.define("open-comp", OpenComp);

  const input = document.querySelector("input");
  const open = document.querySelector("open-comp");
  input.addEventListener("click", e => console.log("lightDOM input"));
  open.addEventListener("click", e => console.log("lightDOM open-comp host node"));
  input.click();
</script>
```

When the above demo loads, it automatically `click()` on the input which trigger a `click` event. This produces the following output:

```
lightDOM input
shadowDOM torpedo: calling e.stopPropagation() and e.preventDefault() on event from slotted target.
``` 

When we `click` event is dispatched on the `<input type="checkbox">`, the flattened DOM and the resulting propagation path looks like this:

```
The flattened DOM and propagation path:
=======================================
  open-comp             \     -   (event listener: doesn't run)
    $shadowRoot          \   *  (event listener: calls stopPropagation())
       $slot              \ /
         input[checkbox]   *   (event listener: print)
```

But, this is confusing for the developer. The developer of the main DOM `document` do not see the event propagating *down into* the shadowDOM of `<open-comp>`. For the developer of the main DOM `document`, the DOM context and propagation path looks like so:

```
The conceptual DOM and propagation path:
========================================
  open-comp            \ -   (event listener: doesn't run)
       input[checkbox]  *   (event listener: print)
```

## HowTo: find SlottedEvents

To check if an event is slotted into a web component, use the following method:

```javascript
function getComposedPath(target, composed) {
  const path = [];
  while (true) {
    path.push(target);
    if (target.parentNode) {
      target = target.parentNode;
    } else if (target.host) {
      if (!composed)
        return path;
      target = target.host;
    } else if (target.defaultView) {
      target = target.defaultView;
    } else {
      break;
    }
  }
  return path;
}

function isSlottedEvent(event, listenerContext) {
  const path = getComposedPath(event.target, false);
  const eventContext = path[path.length - 1];
  return eventContext !== listenerContext && (eventContext === window || eventContext.contains(listenerContext));
} 
```

Then, inside event listeners inside a web component, you can ensure that the event is not slotted against the `this.shadowRoot` (or equivalent in a `closed` shadowDOM).

```javascript
this.shadowRoot.addEventListener("event", function(e){
  if (isSlottedEvent(e, this.shadowRoot))
    return;
  //the event is now safe, it is not slotted into the element
});
```

## Demo: SlottedEventConfusion

```html
<closed-comp>
  light DOM <input id="light" type="checkbox">
</closed-comp>

<script>
  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `
        shadowDOM <input id="shadow" type="checkbox">
        <slot></slot>
      `;
      this._checkBox = shadow.children[0];

      shadow.addEventListener("change", e => {
        console.log("how can this be true? ", e.target.checked);
        console.log("when this is false? ", this._checkBox.checked);
      });
    }
  }

  customElements.define("closed-comp", ClosedComp);

  document.querySelector("input").click();
</script>
```

In the demo above, a `composed:false` `change` event propagates down into a `closed` `shadowRoot`. There is no way to prevent the event from possibly being torpedoed and silently prevented, and it is very simple to see how the developer of `<closed-comp>` might overlook the fact that `change` events can be "slotted" into his component. The situation looks as follows:

```
----------- main doc --     --------- ClosedComp -
|closed-comp          |     | shadowRoot         |
|  input#light        |     |   input#shadow     |
-----------------------     |   slot             |
                            ----------------------
  
                     
             capture   bubble
closed-comp       \     /     
  $shadowRoot      \   /     
    $input#shadow      
    $slot           \ /             '$' marks elements inside ClosedComp shadowDom 
      input#light    * target

propagation path for change (composed: false)
 [window, document, closed-comp, $shadowRoot, $slot, input#light]
```

This is likely to cause confusion for the developer viewing only the context of the shadowDOM. From this perspective, `change` events would likely only occur from the `<input id="shadow">` element. The developer is likely to think that "`<slot>` elements only dispatch `slotchange` events", while the truth is that `<slot>` elements can dispatch any bubbling events in the bubble phase, and *all* events that target regular elements in the capture phase.

## Discussion

To avoid a) torpedoing events from above and b) being confused by slotted events, a web component should actively avoid listening for slotted events. The best practice for doing so, is to:

 * *never* listen for any events on or above a `<slot>` element inside a shadowDOM (except `slotchange` events). (And when you listen for `slotchange` events, be certain that you check that the `target` of the `slotchange` event is the `<slot>` element inside you shadowDOM, as `slotchange` events can also be slotted.)

However. Sometimes your web component needs to react to an external event on a `target` element that should be slotted into your web component. For example, an `<a href>` intentionally wraps around a slotted `target` and its whole purpose of being is to react to the slotted events. But, the twist here is that the `<a href>` element *does not listen for slotted events*; the `<a href>` element adds a default action to the `click` event. This will be explained more in depth in the following chapters, and so we concluded here that if your element needs a default action, this should be implemented as a default action and not as a slotted event listener. (Default actions should not be implemented as slotted event listeners because these event listeners might be torpedoed both from other event listeners above and below).

If you still desperately need to listen for slotted events, the third option is to *listen for the slotted event on the host node*, not from within the shadowDOM. These event listeners should be added/removed in the web component's `connectCallback()`/`disconnectedCallback()`, and when they are added during `connectionCallback()` they will always be first in line on the host node. The benefit of doing this is explicitly to reach into the lightDOM when you listen for events in the lightDOM, so that your code better signals its (unorthodox) practice.   

To conclude: No events should propagate via `<slot>` elements. It would have been better if the browser had disallowed events from propagating down. If a web component wishes to react to a slotted, `composed: true` event, it should instead a) add a default action, b) use an EarlyBird event listener, or c) listen for the element on the host node, as a last resort. Thus, all events that are slotted in can and should be ignored.

## References

 * dunno

## old below, review later

## Event propagation for `composed: false` 

Below is the propagation path for a `toggle` event on a `<details>` element that is inside the shadowDOM of a inner web component that in turn is inside the shadowDOM of another outer web component.

```
------------main doc---     --------------WebComp-
|window               |     | shadowRoot         |
|  web-comp           |     |   slot             |
|    details#main     |     |   details#intern   |
|      summary        |     |     summary        |        
|  div#a              |     ----------------------
|  div#b              |  
-----------------------                     
               capture   bubble
window            \       /   
  web-comp         \     /    propagation path for toggle (composed: false) 
    $shadowRoot     \   /      [window,,, outer-comp, $shadow, $slot, details]
      $slot          \ /             '$' marks the element of the WebComp 
        details#main  * target
          summary     
      $details
        $summary
  div#a
  div#b                 
```

The problem is the two elements `$shadowRoot` and `$slot` from the web component that get access to the toggle event. Lets say:
1. In a certain state, the `WebComp` element wants to call `stopPropagation()` or `preventDefault()` on its `toggle` event.
2. To ensure that this event listener runs before the `toggle` event propagates to other event listeners inside `WebComp`, the stop and prevent event listener is added as an EarlyBird on the `$shadowRoot`. The developer of `WebComp` imagines the following use of `WebComp` and the following propagation of `toggle`:

```
------------main doc---     --------------WebComp-
|window               |     | shadowRoot         |
|  web-comp           |     |   slot             |
|    div              |     |   details#intern   |
|      span           |     |     summary        |        
|  div#a              |     ----------------------
|  div#b              |  
-----------------------                     
              
window              
  web-comp    capture  bubble    propagation path for toggle (composed: false) 
    $shadowRoot    \   /         [$shadowRoot, $details]
      $slot                       
        div      
          span     
      $details       * target
        $summary
  div#a
  div#b                 
```

So, the developer of `WebComp` chooses to add a state specific behavior `$shadowRoot.addEventListener("toogle", e => e.preventDefault() & e.stopPropagation())`. He imagines only scenarioes like this:

```
------------main doc---     --------------WebComp-
|window               |     | shadowRoot         |
|  web-comp           |     |   slot             |
|    div              |     |   details#intern   |
|      span           |     |     summary        |        
|  div#a              |     ----------------------
|  div#b              |  
-----------------------                     
              
window              
  web-comp    capture  bubble     
    $shadowRoot    X    -         
      $slot                       
        div      
          span     
      $details       - target
        $summary
  div#a
  div#b                 
```

But in reality, he also gets this scenario:
 
```
------------main doc---     --------------WebComp-
|window               |     | shadowRoot         |
|  web-comp           |     |   slot             |
|    details#main     |     |   details#intern   |
|      summary        |     |     summary        |        
|  div#a              |     ----------------------
|  div#b              |  
-----------------------                     
                 capture   bubble
window              \       -   
  web-comp           \     -   
    $shadowRoot       X   -   
      $slot            - -     
        details#main    - target
          summary     
      $details
        $summary
  div#a
  div#b                 
```
