# Problem: ShadowTorpedo 

A ShadowTorpedo is a `.stopPropagation()` call made from inside a web component on a composed event (`composed: true`).

## Problem: calling `.stopPropagation()` from a web component
                
**Whenever** a web component calls `.stopPropagation()` on a `composed: true` event, this happens:

1. all the `capture: true` event listeners for the event will be triggered in the lightDOM. This applies both to ancestors of the host node (`CAPTURING_PHASE`) and the host node (`AT_TARGET` phase).
2. none of the `capture: false` event listeners for the event will be triggered in the lightDOM, not on the host node (`AT_TARGET` phase), nor any of its ancestors (`BUBBLING_PHASE`).
3. There will be no explicit notice about this, the event will simply disappear from the lightDOM.

**For the lightDOM developer** such behavior is likely to be both:
* unexpected, and
* cause interruptions in state changes in the lightDOM that rely on the torpedoed event in isolation (likely bad), or rely on the stopped event in combination/sequence with other events (likely very bad).

Such behavior is not likely to be very useful.

## Demo: ShadowTorpedo

```html
<closed-comp></closed-comp>

<script>
  (function () {

    class ClosedComp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<span>Hello sunshine! (dblclick me)</span>`;
        shadow.addEventListener("click", e => console.log(e.type, "shadowDOM click"));
        shadow.addEventListener("dblclick", e => console.log(e.type, "shadowDOM dblclick"));
        shadow.addEventListener("dblclick", e => e.stopPropagation());  //ShadowTorpedo
      }
    }

    customElements.define("closed-comp", ClosedComp);

    const wc = document.querySelector("closed-comp");
    wc.addEventListener("click", e => console.log(e.type, "lightDOM click capture"), true);
    wc.addEventListener("dblclick", e => console.log(e.type, "lightDOM dblclick"), true);
    wc.addEventListener("click", e => console.log(e.type, "lightDOM click target"));         //now you see me,
    wc.addEventListener("dblclick", e => console.log(e.type, "lightDOM dblclick target"));   //now you don't.
  })();
</script>
```

## Solution: Don't call `.stopPropagation()` from web components

The solution is simple. In the same way as calling `stopPropagation()` on events in the capture phase should be banned so as not to disturb state changes in web components, calling `stopPropagation()` on `composed: true` event listeners should be banned for all event listeners added to web components.

## References

 *