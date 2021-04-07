# WhatIs: Bounce sequence?

## Bounced Document Sequence

The Document sequence for bounced event listeners is defined as follows:

Event targets are grouped by their direct PropagationContext. The PropagationContext consists of:
1. `root`: a PropagationRoot which is the `shadowRoot` for web components and the `window` for the main DOM.
2. `parent`: the UseR PropagationContext's PropagationRoot (`root`).
3. `path`: all the element's within that PropagationContext between the `target` and in direct ascent upto and including the PropgationContext's `root`.
   
PropagationContexts are sequenced according to the following three rules, listed in order of priority:
1. **UseR wins**. All event listeners in the UseR contexts *always* run before any event listener in the UseD contexts (cf. top->down, lightDom->shadowDom).
2. **Lowest wins**. If one UseR context uses two other contexts, then the lowest context nearest the `target` run first.
3. **Nest first, sibling second**. Nested UseD contexts run before sibling UseD contexts in the UseR context.

Bounce sequence include all and only the same event targets as in the flattenedDOM `composedPath()`. However, the event target nodes are listed in a different sequence and categorized under their propagation root node (cf. `rootNode` or `window`). This sequencing breaks with the flatDom sequence of event listeners currently in use.

Bounced sequence is therefore listed as a set of propagation contexts consisting of:
   1. `root` is the propagation root of the document, ie. `getRootNode()` or `window`; 
   2. `parent` is the propagation root of the UseR `Document` context; 
   3. `path` is the same `Document` path, ie. `event.path`.

## HowTo: make `bounceSequence(target, root)`?

We can produce a bounced sequence given a `target` and a `root`. We first make a wrapper function for ensuring correct argument types: `bounceSequence(target, root)`. The target must be an `EventTarget`/`window`. The `root` must be either a `true` for `composed: true`, `false` for `composed: false`, or a `Document`/`window`.

Second, we start with the innermost `target` node and build a same document `path` upwards for it. We then repeat this process on the `.host` node of the target until we get to the `endDocumentWindow`. This results in the "HostNode Document Shadows", that we sort from outside in, in the **UseR before UseD** `Document` order.

Then, we traverse all the host node `Document` event targets to find `Element`s that are slotted, and the corresponding `assignedSlot` and `shadowRoot` for each slotted sequence. If there are any SlotMatroschkas inside the slotted shadowDOM, we recursively accept them before we moved on to the next slotted pair.

```javascript

export function bounceSequence(target, root) {
  if (!(target instanceof EventTarget || target instanceof Window))
    throw new Error('IllegalArgumentType: the "target" in bounceSequence(target, ...) must be either an EventTarget or Window.');
  if (root === true)
    root = window;
  else if (root === undefined || root === false)
    root = target.getRootNode();
  else if (!(root instanceof DocumentFragment))
    throw new Error('IllegalArgumentType: the "root" in bounceSequence(target, root) must be either true (as in composed: true), false (as in composed: false), or a Document or Window.');
  return bounceSequenceImpl(target, root, undefined);
}

function bounceSequenceImpl(startNode, endDocumentWindow, parent) {
  let contexts = [];
  for (let t = startNode; t; t = t.host) {
    const path = [];
    for (; t; t = t.parentNode)
      path.push(t);
    t = path[path.length - 1];
    t === document && path.push(t = window);
    contexts[0] && (contexts[0].parent = t);
    contexts.unshift({root: t, path, parent});
    if (t === endDocumentWindow)
      break;
  }
  for (let i = contexts.length - 1; i >= 0; i--) {
    const {root, path} = contexts[i];
    for (let j = 0; j < path.length - 1; j++) {
      const mightBeSlotted = path[j];
      const mightBeHost = path[j + 1];
      const slot = mightBeSlotted.assignedSlot;
      const shadow = mightBeHost.shadowRoot;
      if (slot && shadow)
        contexts = [...contexts, ...(bounceSequenceImpl(slot, shadow, root))];
    }
  }
  return contexts;
}
```

The drawback of making `bouncedSequence` based on `target` and `root` is that it is sensitive to DOM manipulation. If the event targets within the original `bouncedSequence` are repositioned by an event listener, then a subsequent event listener cannot recreate the `bouncedSequence` using the same `target` and `root`.

## HowTo: convert `composedPath()` to `bouncedPath`?

To access the original eventTarget sequence and turn that into a `bouncedPath`, then we need a function to convert the `composedPath()` (which is frozen and represents the original event target sequence), and turn that into a `bouncedPath`.

When converting the `composedPath()` into a `bouncedPath` it is better to iterate top-down, rather than bottom-up:

```javascript
export function convertToBounceSequence(composedPath) {
  return convertToBounceSequenceImpl(composedPath);
}

function convertToBounceSequenceImpl(composedPath, parent) {
  const root = composedPath.pop();
  const context = {parent, root, path: [root]};
  let res = [];
  while (composedPath.length) {
    if (composedPath[composedPath.length - 1] instanceof ShadowRoot) {
      const shadow = convertToBounceSequenceImpl(composedPath, root);
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

## HowTo: `print(bouncedPath)`?

To view and understand the bouncedPath, we should indent the `Document` contexts on the UseD level. This means that the uppermost UseR `Document` will be the leftmost entry, and then `Document`s will be listed in the order in which their event targets are called.

The `print(bouncedPath)` function here listed also checks that all the `root` nodes matches the `getRootNode()` of the elements in the path (this may not be true when elements are repositioned dynamically in the DOM), and that the propagation contexts are listed in the correct a) UseR then UseD, b) lowestWins, and c) nestedBeforeSibling.   

```javascript
function getDepth(depths, root, parent) {
  const depth = depths.get(root);
  if (depth !== undefined)
    return depth
  const parentDepth = depths.get(parent);
  if (parentDepth === undefined)
    throw new Error('BouncedPathBug 1: A UseD document is listed before its UseR document.');
  const depths2 = Array.from(depths.entries()).reverse();
  for (let [lastRoot, lastDepth] of depths2) {
    if (lastRoot === parent) break;
    if (lastDepth.length <= parentDepth.length)
      throw new Error('BouncedPathBug 2: Maybe sibling document listed before a nested document?');
  }
  return depths.set(root, parentDepth + '  '), depths.get(root);
}

export function print(bouncedPath) {
  const depths = new Map([[undefined, '']]);
  if(!bouncedPath.every(({root, path})=>path.every(el=> root === window ? el === window || el === document || el.getRootNode() === document: el.getRootNode() === root))) throw new Error('BouncedPathBug: root node error.');
  return bouncedPath.map(({parent, root, path}) =>
    getDepth(depths, root, parent) +
    (root.host ? root.host.nodeName : 'window') + ': ' +
    path.map(et => et.nodeName || 'window')
  );
}
```

## Demo: `bouncePath` vs. flatDom-path 

This demo compares `bouncedPath` with normal, flatDom `composedPath()`.

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
