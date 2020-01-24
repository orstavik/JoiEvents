# Pattern: Extending the event listener API

`addEventListener(..)`, `removeEventListener(..)`, and `dispatchEvent(..)` are methods of the `EventTarget` interface. This interface is implemented by both the `HTMLElement`, `Document`, and `Window` interfaces, thus providing the ability to listen for events on all such nodes in the DOM.

As we have already seen in the previous chapter, the main thing the `EventTarget` interface needs in order to both register and invoke event listeners is a registry of the event listeners (ie. a callback and options pair) currently active on the node. This registry is however hidden, which provides safety in that one script cannot via the DOM discover which javascript functions other scripts are running. If other scripts were given such access they could:
1. access function objects and names,
2. execute functions in other scripts that were only intended to be triggered by an event and potentially fool other scripts into running malicious code by providing them with other events than intended.
 
But. When working with `Event` management and custom event construction, the `EventTarget` interface is a bit too narrow. Event listeners might need to control the order of events    

## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)