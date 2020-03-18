# Bug: `composed` out of `focus`

Let's ask a simple yes-or-no (boolean) question: Is `focus` `composed: true` or `composed: false`? 

Short answer: it depends..

Long answer: the `focusEvent.composed` property is *always* `true`. But. Quite often, focus events *behave as if `composed === false`.
 
Focus events *only propagate past `shadowRoot` borders when the "focus-within" property changes for the host node too*. Put simply, focus events only behave as if `composed === true` when the focus-within changes for *all* host nodes in the propagation path. When the `focus-within` property of one host node in the propagation path does not change, then the focus event will *only* propagate upto the `shadowRoot` of that host node.
 
Put simply, focus events *behave* as if:
1. `composed: false`, and
2. the focus event was re-dispatched on all the host nodes in the propagation path whose `focus-within` property also changes as a consequence of the inner focus change.  

We can see this behavior played out in a couple of demos:

## Demo: focus events are strange I

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

 * 