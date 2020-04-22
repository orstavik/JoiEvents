# WhatIs: composed propagation 

Composed events propagate both into and out of shadowDOMs.
                        
Usually, we think of event listeners being called:
1. **outside-in** in the `Event.CAPTURING_PHASE`,
2. in registration order in the `AT_TARGET` phase, and then
3. **inside-out** in the `Event.BUBBLING_PHASE`.
 
For `composed: false` events (ie. events that only propagate within a single DOM context) event listeners always complete one phase before they begin the next: first capture, then at target, then bubble. This simple picture is also what we get when we look at `composed: true` events *only* in the "normal", main DOM context: ie. when we simply use native and custom elements in an app, and never look inside them.

## Demo: `AT_TARGET` spaghetti

The problems begin when we look at the propagation sequence of `composed: true` events from both the lightDOM and shadowDOM context at the same time. We start with the demo below that shows how:
1. event listeners on host nodes are considered in the `AT_TARGET` phase, but
2. still called upon in the propagation path sequence as if they were still in the `CAPTURING_PHASE` or `BUBBLING_PHASE`.

```html
<web-comp></web-comp>

<script>
  class WebComp extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<h1>Remember, your shadow will leave you in the dark.</h1>`;
      shadow.addEventListener("composed-event", e=> console.log("3 shadowRoot capture phase", e.eventPhase), true);
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
This looks normal: capture phase, then target phase, and then bubble phase. The only anomaly is that the event listeners on the host node during the `AT_TARGET` phase are sorted capture phase before bubble phase, not registration order as they normally would do. However, this is behavior the developer would likely erroneously expect, so it would likely be forgiven.

When we view the shadowDOM event listeners in isolation, it looks like this:
```
3 shadowRoot capture phase 1
4 shadowRoot>element bubble phase (bubble become at_target) 2
5 shadowRoot>element capture phase (capture become at_target) 2
6 shadowRoot bubble phase 3
```
Again, this looks normal: capture phase, then target phase, and then bubble phase. Here, even the `AT_TARGET` event listeners are run in registration order.

The problem is the nested order of the event listeners. The reality is that even though the event phases are ordered per DOM context, viewed over multiple DOM contexts, the event phases weave into each other and intermingle. 

Propagation sequence
```
Conceptual          Real        
c,t,t,b + c,t,t,b   c, t, c, t, t, b, t, b
              
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

## WhatIs: `AT_TARGET`?

From the "normal" DOM perspective we know that the `AT_TARGET` phase means:
1. the `.target` and `.currentTarget` elements are the same,
2. all event listeners on `AT_TARGET` event listeners will be dispatched for non-bubbling events, and 
3. event listeners `AT_TARGET` are called registration order, not capture-before-bubble order.

But, when composed events propagate on the host nodes, we need to add the following caveats:
1. *host node `AT_TARGET`* event listeners are first sorted capture-before-bubble order, then registration order, and
2. `capture: false` event listeners on host nodes will be called for non-bubbling events because they are conceptually considered `AT_TARGET` even though they in most other ways should be considered part of the bubble phase of the event's propagation.

## Function: `getLastPropagationNode()`

The last node of an event's propagation path is.
* For all `bubbles: true` events:  the last node of `.composedPath()`.
* For `bubbles: false, composed: false` events: the first node of `.composedPath()`.
* For `bubbles: false, composed: true` events: the last host node in `.composedPath()` (i.e. the parent node of a `ShadowRoot` node), or the first node of `.composedPath()`.

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

## References

 * 