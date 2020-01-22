# WhatIs: the composed path?

With web components and shadowDOM things get slightly more complicated. ShadowDOM affect the propagation path in two ways via:
1. Event property `composed`: If the event has the property `composed: true`, its propagation path will include all elements starting with the inner most target, and ending with the `window` (or `defaultView` equivalent in `<iframe>`).
2. The shadowRoot's `mode` setting: If the shadowRoot is `closed`, the innermost `target` visible for event listeners registered on an element in a document *above* the web component will not see the ancestor chain within the web component. The `target` in the event for elements outside a closed shadowRoot is that shadowRoot's host node.

## Demo: Hello sunshine inside a closed shadowroot

```html
<hello-sunshine></hello-sunshine>

<script>
  let sunshineTarget;
  class HelloSunshine extends HTMLElement {
    constructor(){
      super();
      this.shadow = this.attachShadow({mode: "closed"});
      this.shadow.innerHTML = `<h1>hello sunshine</h1>`;
      this.shadow.addEventListener("click", e => console.log(e.target.tagName));
      sunshineTarget = this.shadow.children[0];     //this is a hack, so we can click on the closed content
    }
  }
  customElements.define("hello-sunshine", HelloSunshine);

  function log(e) {
    console.log(e.target);
  }

  const hello = document.querySelector("hello-sunshine");

  hello.addEventListener("click", e => console.log(e.target.tagName));

  sunshineTarget.dispatchEvent(new MouseEvent("click", {composed: true, bubbles: true}));
  sunshineTarget.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```      

Result:

```
1. H1
2. HELLO-SUNSHINE
3. H1
```           

1. As expected, the first event which has `composed: true` propagates out of the shadowDOM and into the lightDOM above. 
2. However, as the shadowRoot is `closed`, the `target` of the event when it propagates outside/above that shadowRoot is the `<hello-sunshine>` host node.
3. The second click event is `composed: false` (the default value). This event *does not propagate* outside/above the shadowRoot of the `<hello-sunshine>` element. 

## Implementation

With shadowDOM we need to make *two* adjustments:
1. The algorithm for finding propagationPath must include host nodes *and* a check of the event's composed property to evaluate if the `window` or a `shadowRoot` should be the origin of propagation.
2. When event listeners are triggered, the event's `target` must be filtered for `closed` shadowRoots. 

The first adjustment, providing an element's `composedPath` is fairly straight forward.

```javascript
function getComposedPath(target, event) {
  const path = [];
  while (true){
    path.push(target);
    if (target.parentNode)
      target = target.parentNode;
    else if(target.host){
      if (!event.composed)
        return path;
      target = target.host;
    } else {
      break;
    }
  }
  path.push(document, window);
  return path;
}
``` 

The second task is a bit more complicated. As the event object remains the same for all event listeners, and the propagation path traverses down and then up the same propagation path, the `target` property of Event's need to be a function that computes the target for the `currentTarget`.

```javascript

```

## 
1. The ancestoral path between a target element and the window can here also contain shadowRoots.
2. The shadowRoots can be `closed` or `open`.
3. `open` shadowRoots are easy. They are in essence completely transparent, you can easily obtain a reference to elements inside it, *and* events inside the shadowRoots will  
2. And *both* the elements within a `` 

If the `mode` shadowRoot is `"closed"` for a web component within the same document, or in a document below, the element onto which the event listener is added, then the `closed` part of the propagation path is excluded from view. In real terms, this means that any target below a `closed` shadowRoot is replaced with the `host` element of that shadowRoot for any event listener associated with a document *above* that shadowRoot. Let's explain this in a demo, which is *much* simpler.     


## References

  * todo find this described in the spec.