# Problem: SlottedEvents 

When an element is slotted into a web component, we get a *BIG* problem: the propagation path will cross *down into* the shadowDOM border, both for `composed: false` and `composed: true` events. This is very complex, and so this time might be a good time to beer with us;)

## HowTo: check for slotted events

To check if an event is slotted into a web component, you can use the following method.

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

Then, inside a web component, you can ensure that the event is not slotted against the `this.shadowRoot` or equivalent.

```javascript
this.shadowRoot.addEventListener("event", function(e){
  if (isSlottedEvent(e, this.shadowRoot))
    return;
  //the event is now safe, it is not slotted into the element
});
```
If the event is slotted, you should not process it in the web component. We discuss this at the end of this chapter.

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

## Conceptual consequences

When events propagate *down into* shadowDOM context when a `target` element is slotted into it, several problems arise:

1. If an event listener inside a shadowDOM calls `.stopPropagation()` or `.preventDefault()` on the event, then this is invisible to the outer context. The event would suddenly be torpedoed and disappear from the DOM, or something might remove a default action in some circumstances. This is likely totally unacceptable, from the viewpoint of the lightDOM context. The first demo illustrate this best.

2. If you attach an event listener for another element in your shadowDOM and this same event is "slotted" into your shadowDOM, then this "slotted" event might trigger functionality inside your web component that were not intended. The slotted event "leaks down into" your shadowDOM. This is bad, from the viewpoint of the shadowDOM context. The second demo illustrate this best. 

## Solution

For internal events, a web component must therefore actively avoid listening for "slotted" events, ie. `composed: true` and `composed: false` events leaking down from above. If your shadowDOM contains `<slot>` elements, this means that all event listeners inside the shadowDOM should either:
1. Be attached to sibling elements of the `<slot>` elements (or their descendants). This is an OK solution.
2. Filter out `<slot>` elements from their event listeners. This is not a pretty solution.
 
If your web component needs to react to external events from slotted elements, such as `<a href>` do, best practice is to:
> add a default actions (see later chapters). This is the only way for reusable web components to try to prevent their "default reaction" from being torpedoed by a `stopPropagation()` torpedo *and* to add a reaction that the users of the web component can turn on/off using the same conventions as the reactions of native elements (such as `<a href>`).

Technically, it is also possible to add/remove an event listener for the slotted events on the host node during `connectCallback()`/`disconnectedCallback()`. However, this method could also torpedo the lightDOM event by either calling `stopPropagation()` or `preventDefault()` without the lightDOM context being aware.     

## Discussion

No events should propagate via `<slot>` elements. If a web component wishes to react to a slotted, `composed: true` event, it should instead a) add a default action, b) use an EarlyBird event listener, or c) listen for the element on the host node, as a last resort. Thus, all events that are slotted in should be ignored.

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
