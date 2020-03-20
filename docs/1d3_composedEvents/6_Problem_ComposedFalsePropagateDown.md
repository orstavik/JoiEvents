# Problem: 

There is a problem that `composed: false` events are allowed to propagate *down into* the shadowDOM border when their `target`s are slotted. 

> maybe an event should never propagate down? Maybe even `composed: true` events should exclude the `shadowRoot` elements of slots in their propagation path?

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
