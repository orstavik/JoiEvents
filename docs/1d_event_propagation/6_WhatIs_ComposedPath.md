# WhatIs: the composed path?

With web components and shadowDOM things get slightly more complicated. ShadowDOM affects the propagation path in two ways via:
1. Event property `composed`: If the event has the property `composed: true`, its propagation path will include all elements starting with the inner most target, and ending with the `window` (or `defaultView` equivalent in `<iframe>`).
2. The shadowRoot's `mode` setting: If the shadowRoot is `closed`, it will hide the innermost `target` for "outside event listeners". For `composed: true` events, this means that they only see a web component's `host` node as the event's `target` if the web component has a `closed` shadowRoot.

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

1. As expected, the first event which has `composed: true` propagates out of the shadowDOM and into the lightDOM above. As the event listeners are added in the bubble phase, the first listener called is the innermost listener from the `constructor()` of the element, and this listener has access to the innermost `<H1>` element as the event's `target`.   
2. However, as the shadowRoot is `closed`. As the event propagates outside this closed shadowRoot, the  `target` of the event is replaced with the `host` node of the web component, ie. the `<hello-sunshine>` element.
3. The second `click` event has `composed: false` (the default value). This event *does not propagate* outside/above the shadowRoot of the `<hello-sunshine>` element, and therefore only reaches the first event listener inside the web component. 

## Implementation

With shadowDOM we need to make *two* adjustments:
1. The algorithm for finding propagationPath must include host nodes *and* a check of the event's composed property to evaluate if the `window` or a `shadowRoot` should be the origin of propagation.
2. When event listeners are triggered, the event's `target` must be filtered for `closed` shadowRoots. 

The first adjustment, providing an element's `composedPath` is fairly straight forward.

```javascript
function getComposedPath(target, event) {
  const path = [];
  while (true) {
    path.push(target);
    if (target.parentNode) {
      target = target.parentNode;
    } else if (target.host) {
      if (!event.composed)
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
``` 

The second task is a bit more complicated. As the event object remains the same for all event listeners, but as the propagation path traverses down and then up the same propagation path, the `target` property of Event's need to be a function that computes the target for the `currentTarget`. We do this by:
 * converting the `target` property of the event into a `getter` function that 
 * works against the locked propagation path
 * at the outset of the `dispatchEvent(..)` function.

```javascript
function dispatchEvent(target, event) {
  const propagationPath = getComposedPath(target, event).slice(1);
  Object.defineProperty(event, "target", {
    get: function () {
      let lowest = target;
      for (let t of propagationPath) {
        if (t === this.currentTarget)
          return lowest;
        if (t instanceof DocumentFragment && t.mode === "closed")
          lowest = t.host || lowest;
      }
    }
  });
  for (let currentTarget of propagationPath.slice().reverse())
    callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
  callListenersOnElement(target, event, Event.AT_TARGET);
  for (let currentTarget of propagationPath)
    callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
}
```

## Demo: A `dispatchEvent` function handling composed paths.

```html
<script src="hasGetEventListeners.js"></script>
<script>
  function getComposedPath(target, event) {
    const path = [];
    while (true) {
      path.push(target);
      if (target.parentNode) {
        target = target.parentNode;
      } else if (target.host) {
        if (!event.composed)
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

  function callListenersOnElement(currentTarget, event, phase) {
    const listeners = currentTarget.getEventListeners(event.type, phase);
    if (!listeners)
      return;
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners)
      if (currentTarget.hasEventListener(event.type, listener.listener, listener.capture))
        listener.listener(event);
  }

  function dispatchEvent(target, event) {
    const propagationPath = getComposedPath(target, event).slice(1);
    Object.defineProperty(event, "target", {
      get: function () {
        let lowest = target;
        for (let t of propagationPath) {
          if (t === this.currentTarget)
            return lowest;
          if (t instanceof DocumentFragment && t.mode === "closed")
            lowest = t.host || lowest;
        }
      }
    });
    for (let currentTarget of propagationPath.slice().reverse())
      callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
    callListenersOnElement(target, event, Event.AT_TARGET);
    for (let currentTarget of propagationPath)
      callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
  }

</script>

<hello-sunshine></hello-sunshine>

<script>
  let sunshineTarget;

  class HelloSunshine extends HTMLElement {
    constructor() {
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

  dispatchEvent(sunshineTarget, new MouseEvent("click", {composed: true, bubbles: true}));
  dispatchEvent(sunshineTarget, new MouseEvent("click", {bubbles: true}));
</script>
```

## References

  * todo find this described in the spec.