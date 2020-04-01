# Problem: CaptureTorpedo 

In the capture phase, `composed: true` events propagate in the lightDOM first, and then into the shadowDOM of a web component, and then out again into the lightDOM in the bubble phase. If a capture phase event listener calls `.preventDefault()` on a `composed: true` event before that event reaches the web component, then that event never reach any event listener inside the web component. It has been "capture torpedoed".

## Demo: CaptureTorpedo

```html
<open-comp></open-comp>

<script>
  class OpenComp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<input type="checkbox">`;
      this._input = this.shadowRoot.children[0];
      //from the perspective of the web component, these event listeners should run on click
      this._input.addEventListener("click", e => console.log("shadowDOM target click."));
      this.shadowRoot.addEventListener("click", e => e.preventDefault());
    }
  }

  customElements.define("open-comp", OpenComp);

  const open = document.querySelector("open-comp");
  open.addEventListener("click", e => console.log("lightDOM capture click."), true);
  open.addEventListener("click", e => e.stopPropagation(), true); //captureTorpedo
  open.addEventListener("click", e => console.log("lightDOM bubble click."));

  open._input.click();
</script>
```

When you `click` on the `<input type="checkbox">` inside the web component, the result:
1. prints only a single line: `lightDOM capture click.`.
2. toggles the inner `<input type="checkbox">`, even though the web component tried to turn the default behavior off.

The reason for this behavior is of course the CaptureTorpedo propagation is stopped/torpedoed. This happens in the lightDOM, the context in which the web component is used, and cannot be controlled by the web component. If the web component needs to always be notified about a `composed: true` event, then an EarlyBird event listener must be used.

```
The flattened DOM and propagation path:
=======================================
  open-comp           *   -   (lightDOM event listener stops propagation,)
    $shadowRoot        - -    (no other event listener runs)
      input[checkbox]   -
```

## Discussion

From the lightDOM, it is difficult to see that calling `.stopPropagation()` on a `click` event should alter the behavior of the `<open-comp>` element. There is no explicit clue nor notification in the lightDOM that a `click` now should *enable* an otherwise *prevented* default action inside `<open-comp>`. After all, such default actions should be actively *disabled* by calling `.preventDefault()` and should not be affected by `stopPropagation()`.

From the shadowDOM, it is difficult to foresee `stopPropagation()` being called. After all, developers rarely use and think about capture phase event listeners, and since the event propagation "begins" its normal, bubbling phase propagation from the lowest most `target`, it would be forgivable if the developer of `<open-comp>` just assumed his event listeners *always* ran first.

## References

 * dunno
