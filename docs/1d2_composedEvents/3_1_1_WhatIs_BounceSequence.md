# WhatIs: Bounce sequence?

Bounce sequence is essentially `composed: true` AND `composed: false` sequence, with *two* rule change:

1. **`Document` before `eventPhase`**
2. `Event`s are declared with `rootNode`/`Document` context, not only `target`. (If no `rootNode` provided, the `.getRootNode()` of the `target` is used, essentially echoing `composed: false`; if `composed: true` is set on the event, the `Document` context is set to `window`, echoing `composed: true`).

These two simple adjustments a) solve *all* the problems associated with `composed` event priority, b) *can be* implemented in existing systems and likely *fix* more issues than it will create, and c) is conceptually very simple.

## RulesOfThumb: for bounced event path

1. A propagation path is defined from an Element (or Document or window) target, up to a context node (Document or window).
2. All elements in the flattenedDOM between target and context are included in the event propagation path.
3. All the elements in the propagation path are **first** sorted according to `.getRootNode()` `Document`.
4. The `Document`s are sorted **top-down** for HostNodeShadowDom contexts first.
5. Then `Document`s are sorted **bottom-up** for any potential SlottedShadowDom contexts.
6. And any nested SlotShadowDom contexts (SlotMatroskas) are in turn sorted **top-down**. (ps. the `Document` priorities are "intuitive" when working with actual elements and event listeners in the DOM).
7. Within each document, the elements are then sorted in capture, target, and bubble phase first (as if no shadowDom ever existed).
8. For each event target, event listeners are sorted FIFO per eventPhase (as usual).
9. `.stopPropagation()` only apply to event listeners within the same `Document`: `stopPropagation()` never applies to event listeners in neither HostShadowDoms nor SlottedShadowDoms.
10. `.preventDefault()` applies to event listeners marked `preventable` in subsequent `Document`s, but does not apply to any event listener inside the same `Document`.
11. There are only *two* `eventPhase`s: capture and bubble. No more "target". To find out if the event phase would correspond to the old at-target, just check if `event.currentTarget === event.path[0]`.

## HowTo: convert `composedPath` to `bouncedPath`?

The algorithm for converting `composedPath` into `bouncedPath` is simple:

1. sort all the elements in the `composedPath` per `.getRootNode()`. One special rule is that `document` is sorted under `window`.
2. The `Document`s in the HostNodeShadowDom hierarchy are sorted first, top-down.
3. Then the SlottedShadowDom Documents are sorted bottom-up (nested SlottedShadowDom elements sorted together top-down).

```javascript
function makeBouncedPath(composedPath) {
  const docs = new Map();
  for (let el of composedPath) {
    let root = el.getRootNode && el.getRootNode() || window;
    root === document && (root = window);
    let list = docs.get(root);
    !list && docs.set(root, list = []);
    list.push(el);
  }
  const sorted = [];
  for (let doc of docs) {
    const [root, elems] = doc;
    if (sorted.length === 0)
      sorted.push(doc);
    else if (elems[0] instanceof HTMLSlotElement)
      sorted.push(doc);
    else
      sorted.unshift(doc);
  }
  return sorted;
}
```

The sequence in `bouncedPath` closely echo the sequence in `composedPath`, hence the simple conversion function.

The below method converts a composedPath into a bouncedPath correctly based on a topDownBounce algorithm.

```javascript
function topDownBounce(composedPath, parent) {
  const root = composedPath.pop();
  const context = {parent, root, path: [root]};
  let res = [];
  while (composedPath.length) {
    if (composedPath[composedPath.length - 1] instanceof ShadowRoot) {
      const shadow = topDownBounce(composedPath, root);
      res = [...shadow, ...res];
    } else {
      const target = composedPath.pop();
      context.path.unshift(target);
      if (target instanceof HTMLSlotElement && composedPath[composedPath.length - 1]?.assignedSlot === target)
        return [context, ...res];
    }
  }
  return [context, ...res];
}
```

## Demo: `bouncePath()`

This demo illustrate what the `bouncePath()` looks like when applied to the same structure as `.composedPath()`.

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

  function makeBouncedPath(composedPath) {
    const docs = new Map();
    for (let el of composedPath) {
      let root = el.getRootNode && el.getRootNode() || window;
      root === document && (root = window);
      let list = docs.get(root);
      !list && docs.set(root, list = []);
      list.push(el);
    }
    const sorted = [];
    for (let doc of docs) {
      const [root, elems] = doc;
      if (sorted.length === 0)
        sorted.push(doc);
      else if (elems[0] instanceof HTMLSlotElement)
        sorted.push(doc);
      else
        sorted.unshift(doc);
    }
    return sorted;
  }

  function printBouncedPath(bouncedPath) {
    return bouncedPath.map(([doc, elems]) => `${(doc === window ? 'window' : doc.host.tagName)}#shadow: ` + elems.map(el => el.nodeName || 'window').join(', '));
  }

  window.addEventListener('click', e => console.log(printBouncedPath(makeBouncedPath(e.composedPath()))));
</script>
```

When you `click` on Hello Sunshine you get a `bouncedPath` with the same 23 elements sorted under 7 different `Document`s/`window. For simplicity, we de

```
"window#shadow:       OUTER-HOST, SPAN, LINK-SLOT, DIV, BODY, HTML, #document, window"
"OUTER-HOST#shadow:   INNER-HOST, LINK-SLOT, #document-fragment"
"INNER-HOST#shadow:   H1, #document-fragment"
"LINK-SLOT#shadow:    SLOT, FRAME-SLOT, #document-fragment"
"FRAME-SLOT#shadow:   SLOT, #document-fragment"
"LINK-SLOT#shadow:    SLOT, FRAME-SLOT, #document-fragment"
"FRAME-SLOT#shadow:   SLOT, #document-fragment"
```

And, the real difference becomes apparent when you look add the `eventPhase` secondarily, and then see that the `Document` now only shifts 6 times:

```
windown, #document, BODY, DIV, LINK-SLOT, SPAN, OUTER-HOST, SPAN, LINK-SLOT, DIV, BODY, HTML, #document, window"
  #document-fragment, LINK-SL0T, INNER-HOST, LINK-SLOT, #document-fragment"
    #document-fragment, H1, #document-fragment"
      #document-fragment, FRAME-SLOT, SLOT, FRAME-SLOT, #document-fragment"
        #document-fragment, SLOT, #document-fragment"
          #document-fragment, FRAME-SLOT, SLOT, FRAME-SLOT, #document-fragment"
            #document-fragment, SLOT, #document-fragment"
```

## Why: `Document` top-down? Why `host` node shadows *before* `slotted` shadows?

In bounce sequencing there are *two* principles that appear contradictory:

1. `Document`s are sorted *top-down* for `host` node shadows, but then
2. *bottom-up* for slotted shadows.

Why is that?

## draft on the reason for bounce sequence.

1. the uppermost document is the "end-user-developer".
2. the innermost target is closest to the (user) action.

(1) The uppermost `Document` is the main document. This is the document of the app. Inner(lower) `Document`s are web components. These are developed by other developers to be used by outer `Document` contexts. Therefore, event listener functions in the outer `Document` contexts should run *first*, so that they can programmatically control/block lower actions. The outer `Document` uses one finite set of inner elements (and thus one finite set of other `Document`s); an inner element can be used in hundreds or thousands of other outer contexts, and therefore cannot be expected to adjust its behavior to the quirks of all of them. Outer `Document` should control inner `Document`, and by having the other `Document` event listeners run before the inner `Document` event listeners, this is achieved.

The purpose of `.preventDefault()` is exactly this. `.preventDefault()` is a function that can be called to control a function associated with the internals of native elements that will be triggered *after* event propagation. Put simply, *when event propagation bounce, default actions can be implemented as more or less regular event listeners in any web component!*

This means that event listeners in the upper `Document`s should be processed *before* the lower "HostNodeShadowDom" `Document`s.

(2) If a `<h1>` is put inside a `<div>` which is put inside an `<a>`, and the user clicks on the `<h1>`, then the `<div>` is closer to the user action than the `<a>`. Thus, if `<div>` and `<a>` has one competing (default) action, then by default the action *chosen* by the user would be the action of the element *closest* to the original target.

In the case of SlotMatroskas, the outer SlotMatroska should run *before* the inner SlotMatroska.

This means that you get the following recursive structure:

1. you start with the full path from the inner most target to the top, and you reverse it.
2. Then you find all the targets to the outermost `Document`.
3. This is your first list of elements, you run the event listeners on these elements capture, then bubble.
4. Then you look bottom up at the elements inside the `Document`. If there is a ShadowDOM associated with that element in the path, you step into that document. You repeat the steps from 2 in this `Document`.
5. When there are no more elements to look for shadowDOMs in, then you go back to the top.

## References

*
