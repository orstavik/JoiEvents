# Pattern: `composed: false` becomes `composed: true`

Sometimes, you wish a web component to simply mirror/transpose the state change of an internal element. For example, your web component might simply wrap around an existing `<details>` element, and then you wish for the `<details>`'s `toggle` event to echo out of the web component.

To achieve this effect, you:
1. clone the `toggle` event
2. make the clone also `composed: false`, at least usually, and then
3. dispatch the cloned event to the host node.   
    
## References

 * 