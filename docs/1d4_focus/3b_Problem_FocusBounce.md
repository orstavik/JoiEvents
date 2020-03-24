# Problem: `focus` bounces

Question: Are focus events `composed: true` or `composed: false`? 

Answer: in principle, the focus events are set as `composed: true`; in practice, the focus events kinda bounce.

## How focus events behave

The `composed` property of focus events are always set to `true`. So, in theory, the focus events should be `composed: true`. But. In practice, the propagation path of focus events are often cut of at a shadowDOM border. As if the focus event were `composed: false` or partially `composed: true/false`. Put simply, the focus events kinda bounce.


 * When the "focus-within" property of *all* host nodes in the propagation path changes (or the propagation path contains no host nodes), then the focus events behave as if they were regular `composed: true` events.
 * when the "focus-within" property of *the lowest* host node in the propagation path does *not* change, then focus events behave as if they were `composed: false` events with a) a `composedPath()` restricted according to `composed: false` criteria, but with b) a buggy `composed` property set to `true`.
 * otherwise, the focus events will bounce up through all host nodes where the "focus-within" property changes until it reaches a host node whose "focus-within" property has not changed.


1. If the 
Focus events bounce *iff the host node of the current shadowDOM's "focus-within" property has changed*. 
2. When the browser bounces the focus event, it does not alter the propagation sequence among the DOM contexts in which the element bounces. This means that the capture-phase event listeners of the top-most DOM contexts will run first. As if the focus events were regular `composed: true` events.
3. The browser (being having God access in its own code) dispatch the same focus event object in all DOM contexts that the focus events bounce.

Thus, focus events **only propagate in DOM context where the lowest `target` element or a host node containing this `target` whose "focus-within" property has changed**. 

## Demo: focus events bounce

```html
<web-component></web-component>

<script>
  function log(e) {
    console.log(
      e.type, 
      e.composed,
      e.composedPath()[0],
      e.composedPath()[e.composedPath().length-1]);
  }

  class WebComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <input type="text" value="one">
        <input type="text" value="two">
      `;
      this.shadowRoot.addEventListener("focusin", log, true);
      this.shadowRoot.addEventListener("focusout", log, true);
      this.shadowRoot.addEventListener("focus", log, true);
      this.shadowRoot.addEventListener("blur", log, true);
    }
  }

  customElements.define("web-component", WebComponent);

  window.addEventListener("focusin", log, true);
  window.addEventListener("focusout", log, true);
  window.addEventListener("focus", log, true);
  window.addEventListener("blur", log, true);
</script>
```

If you `click` or "tab" to focus on the first `<input value="one">` element, then the `focusin` event is dispatched and propagates to *both* the `window` and the `shadowRoot` inside `WebComponent`. The first change of focus shifts the focus a) to the `<web-component>` element in the topmost, main DOM layer, and b) to the `<input value="one">` element inside the `shadowRoot`.

If you then `click` or "tab" to focus on the second `<input value="two">` element, then the `focusin` event is dispatched and propagates to *only* the `shadowRoot` inside the `WebComponent`. The second change of focus shifts the focus only in the context of the inner shadowDOM, and not in the context of the outer, main lightDOM.

The bug seems mostly associated with the `.composed` property:
1. `focusEvent.composed === true` for both the first and second instance of the event, while the second event behaves as if `focusEvent.composed === false`.
2. In the second event, `focusEvent.composedPath()` yields a propagation path that would echo the `.composed` property being `false`. Ie. the propagation behavior and the method `.composedPath()` are in sync, it is only the property `.composed` that seems out of wack in the second instance.          


## Demo: focus events are strange II

We add web components inside web components:

```html
<outer-component></outer-component>

<script>
  class InnerComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <input type="text" value="one">
        <input type="text" value="two">
      `;
      this.shadowRoot.addEventListener("focusin", e => console.log("InnerShadow: ", e.composedPath()[0].value));
    }
  }

  customElements.define("inner-component", InnerComponent);

  class OuterComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <inner-component></inner-component>
        <input type="text" value="three">
      `;
      this.shadowRoot.addEventListener("focusin", e => console.log("OuterShadow: ", e.composedPath()[0].value));
    }
  }

  customElements.define("outer-component", OuterComponent);

  window.addEventListener("focusin", e => console.log("main: ", e.composedPath()[0].value));
</script>
```
In the demo above, if you:
1. `click` on `<input value="one">`, then
1. `click` on `<input value="two">`, then
1. `click` on `<input value="three">`, then
1. `click` on `<input value="one">`

   you get the following result:
   
```
//click one
InnerShadow:  one
OuterShadow:  one
main:  one
//click two
InnerShadow:  two
//click three
OuterShadow:  three
//click one
InnerShadow:  one
OuterShadow:  one
```

On closer inspection, `composed === true` always, as in the previous demo. Furthermore, the `composedPath()` stops on the `shadowRoot` whose "focus-within" property would be true.

### How focus events should have been implemented
 
Focus events should have been implemented like so:

1. `composed: false`
2. the function in the browser that controls focus changes should have dispatched new focus change events for host nodes whose "focus-within" property also changed.
3. This would make the `.composed` property of focus events in-sync with the `composedPath()` of each DOM layer, from the `target` and upward. This would make the current overall behavior of focus events in-sync with the `composed` property. This would remove the special behavior of focus events. And the only thing that would be different is a) there would be multiple event objects, one per DOM layer/non-composed path, instead of a single event object that propagates a partial composed path, and b) the `composedPath()` would differ below the node set as the `target` of the event.

If you implement your own focus like events, use this method: dispatch a non-composed event on the `target`, and then cast a second, different non-composed event on the host node of the shadowDOM that contains that target if the property changes reflect recursively upwards as "focus-within" does.  

## References

 * [WHATWG: The focusing steps](https://html.spec.whatwg.org/multipage/interaction.html#focusing-steps);
 * [W3: Document Focus and Focus Context](https://www.w3.org/TR/uievents/#events-focusevent-doc-focus)
