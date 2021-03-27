# Problem: `composed` sequence?

## WhatIs: event propagation priority?

Whenever an event occurs in the DOM, the browser must decide:
1. which event listeners
2. on which `HTMLElement`s,
3. in which `Document`s in
4. which `eventPhase` to call, and
5. in what sequence/which group of listeners to prioritize.

Viewed simplistically, the rules of thumb for event propagation are:

1. Event listeners are called in the order they were added.
2. `CAPTURING_PHASE`, then `AT_TARGET`, then `BUBBLING_PHASE`.
3. Event's with `bubble: false` has no `BUBBLING_PHASE`.
4. `composed: true` events cross ShadowDom borders; `composed: false` traverse only up to the `rootNode` of the `target` element.
5. Elements are sorted top-down during `CAPTURING_PHASE` and bottom-up during `BUBBLING_PHASE`.

And, viewed simplistically, the *priority* of these sorting rules is:

**First `eventPhase`**: *all* elements and event listeners are sorted into three groups: 1) `CAPTURING_PHASE`, 2) `AT_TARGET`, and 3) `BUBBLING_PHASE`.

**Second `composed`**: elements are included or excluded based on a) the `event.composed` property and b) the elements' `.getRootNode()` property/ `Document` belonging.

**Third element hierarchy**: within the three `eventPhase` groups, elements are sorted 1) top-down, 2) one element, 3) bottom-up.

**Forth `addEventListener` FIFO**: last, the event listeners are sorted on a FIFO sequence per element.

## Problem: event propagation priority conflicts

The set of priorities above *should* have yielded a complete and organized propagation path. However. There are *several* issues and conflicts intrinsic in the above organization that require *some* additional *rule exceptions*:

1. When the innermost, lowest `target` is located in a ShadowDom, then the `.host` node of that `target` will function as the `target` in the lightDOM. The browser therefore:
   * **sorts** the `host` node as *part* **`CAPTURING_PHASE` and `BUBBLING_PHASE`**, and select only the capture or bubble event listeners when visiting the node, but
   * **marks** the `event` as **`AT_TARGET`** when the event listeners are called.
	
   Thus, the `AT_TARGET` phase essentially mash together *three different* `eventPhase`s that *prioritize* event listeners differently: 
	1. `AT_INNERMOST_TARGET` *selects* both capture and bubble event listeners and organize them *collectively* as `addEventListener`-FIFO.
	2. `AT_HOST_TARGET_CAPTURE` selects only capture event listeners.
	3. `AT_HOST_TARGET_BUBBLE` selects only bubble event listeners. 
	   
   The rub is that a) *if* the element contains a `closed` shadowDOM, then b) from the event listeners on the host-node it is impossible to identify whether the `eventPhase` is actually an `AT_INNERMOST_TARGET` phase or an `AT_HOST_TARGET_CAPTURE/BUBBLE` phase, and thus c) you might get capture event listeners sometimes running *before* bubble event listeners, and sometimes running *after* bubble event listeners, depending on exactly *where* on the host node a mouse event occurs (for example).

2. During the `AT_INNERMOST_TARGET` phase, the event listeners are sorted in `addEventListener`-FIFO order *before* `eventPhase` order. In *all* other instances `eventPhase` is prioritized *first*.
   
3. `composed: true` commonly traverse all elements from the innermost `target` all the way up to `null` or `window`. However, the *special-case* `FocusEvent`s *often* propagate up *past* ShadowDom borders, but can *stop* before reaching the top. Thus, a `composed: true` path can include several `Document`s, but it still selectively *exclude* parent `Document`s. The *native* events support this, but individual developers *cannot* replicate this behavior using `EventTarget.dispatchEvent()` as this method *do not support* limiting `composed: true` events upwards. To conclude: there exists *two* `composed: true` types: `composed: all-the-way-up` (what we commonly think of as `composed: true`) and `composed: up-to-Document-X` (`FocusEvent`), and *`dispatchEvent` only support `composed: all-the-way-up`*. 
   
4. **`composed: false` actually do traverse past ShadowDom borders.** Yes, `composed: false` will traverse only up to the `rootNode` of the innermost `target` element. But! If there are any elements along this path that `<slot>` any other elements along this path into its shadowDOM, the `composed: false` event will propagate *down into* those "SlottedShadowDOM" contexts *and* trigger event listeners *inside those other `Document`s*. `composed: false` therefore *actually means* `composed: current-plus-down-into-slotted-Documents` (but not up into `.host` node `Document`s).
   
5. `stopImmediatePropagation()` was added to fix the nuance that `stopPropagation()` didn't affect the propagation on the current element during the current `eventPhase`. But, with the advent of `composed: true` and `composed: current-plus-down-into-slotted-Documents`, `stopPropagation()` now affects event listeners in other `Document`s too. This is seriously flawed. 

6. `.preventDefault()` and native defaultActions do *not* fit this event propagation order, and has therefore been forced to run in a separate event propagation sequence outside of this event listener track. More on this shortly.

7. But. The biggest weakness of all is the number of times the browser will *switch* from one `Document` to another and back again when calling event listeners following current event propagation sequencing. And this we discuss now. 

## Demo: complex `.composedPath()`

This demo illustrate how the `.composedPath()` is created and will sort event listeners on different elements.

```html
<div>
  <link-slot>
    <span>
      <outer-host></outer-host>
    </span>
    <h2>hello world</h2>
  </link-slot>
</div>

<script>
  class OuterHost extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = '<link-slot><inner-host></inner-host></link-slot>';
    }
  }

  class InnerHost extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = '<h1>hello sunshine</h1>';
    }
  }

  class LinkSlot extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = '<frame-slot><slot></slot></frame-slot>';
    }
  }

  class FrameSlot extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = '<slot></slot>';
    }
  }

  customElements.define("outer-host", OuterHost);
  customElements.define("inner-host", InnerHost);
  customElements.define("link-slot", LinkSlot);
  customElements.define("frame-slot", FrameSlot);

  window.addEventListener('click', e => console.log(e.composedPath()));
</script>
```

When you `click` on Hello Sunshine you get a `.composedPath()` with 23 elements from 7 different `Document` contexts.

```
Elements
[h1, document-fragment, inner-host, slot, slot, document-fragment, frame-slot, document-fragment, link-slot, document-fragment, outer-host, span, slot, slot, document-fragment, frame-slot, document-fragment, link-slot, div, body, html, document, Window]

Documents
1. main document/window (M)
2. inner-host shadow (I)
3. outer-host shadow (O)
4. link-slot shadow inside I (L1)
5. frame-slot shadow inside L1 (F1)
4. link-slot shadow inside M (L2)
5. frame-slot shadow inside L2 (F2)

Elements in the composedPath marked by the Document they belong to 
[I, I, O, L1, F1, F1, L1, L1, O, O, M, M, L2, F2, F2, L2, L2, M, M, M, M, M, M]
```

However, as the propagation first divide propagation according `eventPhase`, the actual propagation sequence of the events are:

```
CAPTURING_PHASE (and AT_HOST_TARGET_CAPTURE in big letters)
=> Window, document, html, body, div, link-slot, document-fragment, frame-slot, document-fragment, slot, slot, span, OUTER-HOST, document-fragment, link-slot, document-fragment, frame-slot, document-fragment, slot, slot, INNER-HOST, document-fragment,

AT_TARGET (as in AT_INNERMOST_TARGET) 
=> h1 

BUBBLING_PHASE (and AT_HOST_TARGET_BUBBLE in big letters)
=> document-fragment, INNER-HOST, slot, slot, document-fragment, frame-slot, document-fragment, link-slot, document-fragment, OUTER-HOST, span, slot, slot, document-fragment, frame-slot, document-fragment, link-slot, div, body, html, document, Window
```

And, if we look at the times *when the event is being passed from one `Document` to another, we see that we have 19(!) context shifts between the 7 `Document`s.
```
M, M, M, M, M, M, 
  L2, L2, 
    F2, F2, 
  L2, 
M, M, 
  O, O, 
     L1, L1, 
        F1, F1, 
     L1, 
  O, 
     I, I, I, 
  O, 
     L1, 
        F1, F1, 
     L1, L1, 
  O, O, 
M, M, 
   L2, 
      F2, F2, 
   L2, L2, 
M, M, M, M, M, M
```

The problem here is the number of times that the event passes from one `Document` to another. It quickly becomes terrible complex to foresee when event listener *might* be called. But. To understand this problem, we must first repeat *why* we want to separate our code in different `Document`s in the first place. 

## Why: different `Document`s?

Or, more precisely, why web components? Well, the raison d'être for web components is: a) reuseability and b) modularity. In other words, one developer should be able to create a web component in isolation, and have that web component also work in the context of another web `Document` (inside an `.html` file or inside the shadowDOM of another web component).    

To be able to write web components in isolation: the html elements of the web component is separated in a ShadowDOM, the CSS of the web component is separated from the rest of the CSS in the application, and the web component has its own class and some callback functions that enable it to stay apart from the rest of the JS application.

To be able to interact with other web components: the ShadowDOM is connected to other DOMs via the hostNode and `<slot>` elements; CSS (custom) properties can be inherited along the hostNode and `<slot>` elements; and JS methods can be called more or less freely across web component borders.

For events, the `composed: false` enable the developer to keep events inside one `Document`; `composed: true` enable the developers to share an event across `Document` borders.

## HowTo: isolate event control?

However, `composed: true` is a *bad* way to share an event between different DOM contexts that should be written in isolation. Why?

`composed: true` sorts the propagation sequence in event phase first, then `Document`. In the simple example with the `<check-box>` element, this might not be too bad: *first* the main document receives the event relay baton (in the capture phase, *second* the shadowDOM gets event relay baton, *finally* main document receives the event relay baton (bubble phase). 

But, the more web components are involved, the more complex things get: if the main document had placed the `<check-box>` inside a `<details><summary>` for example, you would now have the following event relay baton: 1. main capture, 2. details shadow capture, 3. main capture (summary element), 4. summary shadow capture, 5. main capture/at-target (`<check-box>` element), 6. `<check-box>` shadow capture-bubble, 7. main bubble/at-target (`<check-box>` element), 8. summary shadow bubble, 9. main bubble (summary element), 10. details shadow bubble, 11. main bubble. If every document was written by a different developer, this would be four different developers exchanging one event ten(!) times.

Why are these exchanges a problem? Are they not only a technicality? No. Every time a developer gets the event he gets the control to do state changes. He can for example call `stopPropagation()`, `preventDefault()`, change a property inside his own document, read a property on another element (that can also be changed from inside the element), etc. etc. Especially when the event passes in and out of slotted shadowDOM context, developers don't consider that such state changes might have occured between one event listener and another inside his own `Document`. Therefore, you don't want to pass the same event in and out of different documents that many times, you want one developer to finish his part of the race before handing the control over to the next developer, and so forth. (Imagine how exciting and chaotic a 4x100m relay sprint would be if the runners had to pass the baton between them 10 times, instead of 3, per run.)

The `eventPhase` property plays no such role. Work isn't isolated based on `eventPhase`, work is isolated based on `Document`s (web components, html files, etc.). Thus, it doesn't have any negative consequence of moving `eventPhase` down a peg and prioritize event propagation on `Document` order *first*. 

## References

*
