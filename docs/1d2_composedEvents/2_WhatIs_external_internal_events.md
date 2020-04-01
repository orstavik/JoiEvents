# WhatIs: External and Internal Events?

## External events

External events represent **a state change of data outside of the DOM**. For example, a `keydown` event represents a state change of the user's finger, a change of the mouse buttons position, a primitive UI event in the OS; the `offline` event represents a state change in a cut network cable, a router loosing power, the OS loosing wifi connection. The event is a "sign of a state change", and external events represents state changes external to the DOM. 

External events can be relevant for any element anywhere in the DOM. And therefore, they should be accessible to all DOM layers. For example, a `click` is an external event that can be directed at elements in both the main *and* shadowDOM contexts. In an app, a `click` can `target` both a play button in the shadowDOM of a `<video>` element or a regular button in the main DOM. Another example is the `resize` event. When the `window` `resize`s, a reaction might be triggered that both control the layout of the control panel inside a `<video>` element or the content of the footer at the bottom of the main document. Therefore, the external `click` event needs to be accessible in all DOM contexts.

## Internal events

Internal events represent **a state change of data internalized in the DOM itself**. The DOM consists of a series of elements and nodes, and many events are dispatched that alert of a change of a state of one such element and/or one of its properties. Examples of internal events are:
1. `change`: the value of an input element *has been* changed. The `change` event are sometimes dispatched only when the input element looses focus. The `change` event represent a state change of an input element.
2. `reset`: the `value` property (or equivalent) of potentially several input elements in a `<form>` *will be* changed. The `reset` event represent a state change internal to a group of elements clustered under a single `<form>` element *all within the same DOM context*.
3. `toggle`: the `open` property of a `<details>` element *has been* changed. 
    
## References

 * 