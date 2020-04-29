# WhatIs: composed propagation 

Composed events propagate both into and out of shadowDOMs.
                        
Usually, we think of event listeners being called:
1. **outside-in** in the `Event.CAPTURING_PHASE`,
2. in registration order in the `AT_TARGET` phase, and then
3. **inside-out** in the `Event.BUBBLING_PHASE`.
 
For `composed: false` events (ie. events that only propagate within a single DOM context) event listeners always complete one phase before they begin the next: first capture, then at target, then bubble. This simple picture is also what we get when we look at `composed: true` events *only* in the "normal", main DOM context: ie. when we simply use elements and web components and don't look inside them.

The complexity arise when the browser flattens the DOM and merges the propagation sequence of `composed: true` events of different DOM contexts.
1. The propagation sequence of shadowDOM is **nested *in the middle of* the `AT_TARGET`** phase of the lightDOM, thus
2. in the flattened propagation sequence spreading out `AT_TARGET` event listeners among the sequence of `CAPTURING_PHASE` and `BUBBLING_PHASE` event listeners. 

## Demo: `AT_TARGET` event listeners everywhere

```html
<web-comp></web-comp>

<script>
  class WebComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<h1>Remember, your shadow will leave you in the dark.</h1>`;
      shadow.addEventListener("click", e=> console.log("3 shadowRoot capture phase", e.eventPhase), true);
      shadow.children[0].addEventListener("click", e=> console.log("4 shadowRoot>element bubble phase (bubble become at_target)", e.eventPhase));
      shadow.children[0].addEventListener("click", e=> console.log("5 shadowRoot>element capture phase (capture become at_target)", e.eventPhase), true);
      shadow.addEventListener("click", e=> console.log("6 shadowRoot bubble phase", e.eventPhase));
    }
  }
  customElements.define("web-comp", WebComp);

  document.addEventListener("click", e=> console.log("1 main document capture phase", e.eventPhase), true);
  document.body.children[0].addEventListener("click", e=> console.log("7 host node bubble phase (bubble become at_target)", e.eventPhase));
  document.body.children[0].addEventListener("click", e=> console.log("2 host node capture phase (capture become at_target)", e.eventPhase), true);
  document.addEventListener("click", e=> console.log("8 main document bubble phase", e.eventPhase));
</script>
```
Results in:
```
1 main document capture phase 1
2 host node capture phase (capture become at_target) 2
3 shadowRoot capture phase 1
4 shadowRoot>element bubble phase (bubble become at_target) 2
5 shadowRoot>element capture phase (capture become at_target) 2
6 shadowRoot bubble phase 3
7 host node bubble phase (bubble become at_target) 2
8 main document bubble phase 3
```

When we view the lightDOM event listeners in isolation, it looks like this:
```
1 main document capture phase 1
2 host node capture phase (capture become at_target) 2
7 host node bubble phase (bubble become at_target) 2
8 main document bubble phase 3
```
This looks normal: capture phase, then target phase, and then bubble phase. The only anomaly is that the event listeners on the host node during the `AT_TARGET` phase are sorted capture phase before bubble phase, not registration order as they normally would do. However, developers would likely expect such behavior (erroneously), so the browser can be forgiven for making it so.

When we view the shadowDOM event listeners in isolation, they look like this:
```
3 shadowRoot capture phase 1
4 shadowRoot>element bubble phase (bubble become at_target) 2
5 shadowRoot>element capture phase (capture become at_target) 2
6 shadowRoot bubble phase 3
```
Again, this looks normal: capture phase, then target phase, and then bubble phase. Here, even the `AT_TARGET` event listeners are run in registration order (as we are used to).

The problem occurs as the DOM contexts are nested. This creates a different *real* propagation path that has a different propagation order within itself between the different event phases, than what the event has in each individual DOM context. Thus, viewed across multiple DOM contexts, the `AT_TARGET` event phase weaves into and out of both the `CAPTURING_PHASE` and the `BUBBLING_PHASE`. 

Propagation sequence
```
Conceptual          Real        
c,t,t,b||c,t,t,b    c,t,c,t,t,b,t,b
              
\c /b               \c       /b
 **t                 *t     *t
======              - - - - - - 
\c /b                 \c   /b
 **t                   *t*t
```
In the later chapter about bouncing events, we will illustrate how this problem can be avoided.
 
## Demo: non-bubbling events bubble to `AT_TARGET` host node event listeners

In the second demo, we will illustrate that this means that event listeners on "bubbling" host nodes will be called when the event bubbles up the *real* propagation path because the event listeners on host nodes are considered `AT_TARGET`. 

```html
<web-comp></web-comp>

<script>
  document.addEventListener("bubbles-false", e=> console.log("1 main document capture phase", e.eventPhase), true);
  document.body.children[0].addEventListener("bubbles-false", e=> console.log("2 host node capture phase (capture become at_target)", e.eventPhase), true);
  document.body.children[0].addEventListener("bubbles-false", e=> console.log("7 host node bubble phase (bubble become at_target)", e.eventPhase));
  document.addEventListener("bubbles-false", e=> console.log("8 main document bubble phase", e.eventPhase));

  class WebComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<h1>Remember, your shadow will leave you in the dark.</h1>`;
      shadow.addEventListener("bubbles-false", e=> console.log("3 shadowRoot capture phase", e.eventPhase), true);
      shadow.children[0].addEventListener("bubbles-false", e=> console.log("4 shadowRoot>element bubble phase (bubble become at_target)", e.eventPhase));
      shadow.children[0].addEventListener("bubbles-false", e=> console.log("5 shadowRoot>element capture phase (capture become at_target)", e.eventPhase), true);
      shadow.addEventListener("bubbles-false", e=> console.log("6 shadowRoot bubble phase", e.eventPhase));
      shadow.children[0].dispatchEvent(new CustomEvent("bubbles-false", {composed: true, bubbles: false}));
    }
  }
  customElements.define("web-comp", WebComp);
</script>
```
Results in:
```
1 main document capture phase 1
2 host node capture phase (capture become at_target) 2
3 shadowRoot capture phase 1
4 shadowRoot>element bubble phase (bubble become at_target) 2
5 shadowRoot>element capture phase (capture become at_target) 2
7 host node bubble phase (bubble become at_target) 2
```

## Calling `.composedPath()` and `.target` in different DOM contexts  

For `composed: true` events, the `.composedPath()` and `.target` properties yield different results as it propagates through different DOM contexts:

1. Event listeners added *inside* a shadowDOM (ie. to an element/node inside a `ShadowRoot`) will get the `target` element as seen in that DOM context and the `composedPath()` that include nodes from both the shadowDOM and the lightDOM context.
2. Event listeners added to the host node or one of its ancestors will see the host node as the `target`.
3. If the `ShadowRoot` is `closed`, then the `composedPath()` will only include nodes from the lightDOM context; if the `ShadowRoot` is `open`, then the `composedPath()` will include nodes from both the shadowDOM and lightDOM context (as the event listeners registered inside the shadowDOM would).

```html
<web-comp></web-comp>

<script>
  class WebComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<h1>Remember, your shadow will leave you in the dark.</h1>`;
      shadow.addEventListener("click", e=> console.log(e.target.tagName, e.composedPath()));
    }
  }
  customElements.define("web-comp", WebComp);

  document.addEventListener("click", e=> console.log(e.target.tagName, e.composedPath()));
</script>
```                                                           
Results in:
```
h1, [h1, shadowRoot, web-comp, body, document, window]
web-comp, [web-comp, body, document, window]
```

## WhatIs: the `eventPhase` `AT_TARGET`?

From the "normal" DOM perspective we know that the `AT_TARGET` phase means:
1. the `.target` and `.currentTarget` elements are the same,
2. all event listeners on `AT_TARGET` event listeners will be dispatched for non-bubbling events, and 
3. event listeners `AT_TARGET` are called registration order, not capture-before-bubble order.

But, when composed events propagate on the host nodes, we need to add the following caveats:
1. *Host node event listeners* for `composed: true` events are in the `AT_TARGET` phase.
2. `AT_TARGET` host node event listeners are ordered capture-before-bubble, then registration order in a within DOM context basis.
3. `AT_TARGET` host node event listeners are called queued according to their `CAPTURING_PHASE` and `BUBBLING_PHASE` position in the flattened DOM.
4. `bubbles: false` events will not trigger `AT_TARGET` host node event listeners: ie. the queuing order in the flattened DOM is not influenced by `bubbles: false`.
5. Calling `.stopPropagation()` on an inner `AT_TARGET` event listener will stop `AT_TARGET` event listeners on outside host nodes: ie. `stopPropagation()` follows the queuing order in the flattened DOM propagation path.

## Function: `getLastPropagationNode(event)`

If you have access to the event object when it propagates, you can find the last node of an event's propagation path.
1. For all `bubbles: true` events:  the last node of `.composedPath()`.
2. For `bubbles: false, composed: false` events: the first node of `.composedPath()`.
3. For `bubbles: false, composed: true` events: the last host node in `.composedPath()` (i.e. the parent node of a `ShadowRoot` node), or the first node of `.composedPath()`.

```javascript
function getLastPropagationNode(event) {
  const path = event.composedPath();
  if (event.bubbles)
    return path[path.length - 1];
  if (!event.composed)//todo check focus events, that they are composed.true
    return path[0];
  let last = event.target;
  for (let i = 1; i < path.length-1; i++) {
    if (path[i] instanceof ShadowRoot)
      last = path[i+1];
  }
  return last;
}
```

Note! You can always find the last propagation node for composed, non-bubbling events, because the last `AT_TARGET` node will be the uppermost host node. Thus, if you can intercept the event, you can always `target` the last propagation node.

Note! If `stopPropagation()` or `stopImmediatePropagation()` is called on an earlier `target`, the event will not pass to the last propagation node. In later chapters we will discuss in depth the problems of `stopPropagation()` in a web component environment.

## Discussion: phasing out phase

The problem with  

## References

 * 