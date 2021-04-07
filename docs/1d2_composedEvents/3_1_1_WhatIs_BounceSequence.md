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
      this.shadowRoot.innerHTML = '<upper-inner-link-slot><inner-link-slot><inner-host></inner-host></inner-link-slot></upper-inner-link-slot>';
    }
  }

  class InnerHost extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<h1>hello sunshine</h1>';
    }
  }

  class LinkSlot extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<frame-slot><slot></slot></frame-slot>';
    }
  }

  class FrameSlot extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<slot></slot>';
    }
  }

  class InnerLinkSlot extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<inner-frame-slot><slot></slot></inner-frame-slot>';
    }
  }

  class InnerFrameSlot extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<slot></slot>';
    }
  }

  class UpperInnerLinkSlot extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<upper-inner-frame-slot><slot></slot></upper-inner-frame-slot>';
    }
  }

  class UpperInnerFrameSlot extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "open"});
      shadowRoot.innerHTML = '<slot></slot>';
    }
  }

  customElements.define("outer-host", OuterHost);
  customElements.define("inner-host", InnerHost);
  customElements.define("link-slot", LinkSlot);
  customElements.define("frame-slot", FrameSlot);
  customElements.define("inner-link-slot", InnerLinkSlot);
  customElements.define("inner-frame-slot", InnerFrameSlot);
  customElements.define("upper-inner-link-slot", UpperInnerLinkSlot);
  customElements.define("upper-inner-frame-slot", UpperInnerFrameSlot);
</script>
<script type="module">

  import {bounceSequence, convertToBounceSequence, print} from "../bounce/BouncedPath.js";

  window.addEventListener('click', e => console.log(e.composedPath()));
  window.addEventListener('click', e => {
    const bouncedPathConvert = print(convertToBounceSequence(e.composedPath()));
    const bouncedPathFromTarget = print(bounceSequence(e.composedPath()[0], true));
    console.log(JSON.stringify(bouncedPathConvert) === JSON.stringify(bouncedPathFromTarget));
    console.log(bouncedPathFromTarget);
  });

  const h2 = document.querySelector('h2');
  h2.click();
  const h1 = document.querySelector('outer-host').shadowRoot.querySelector('inner-host').shadowRoot.querySelector('h1');
  h1.click();
</script>
```

`h2.click()` produces the following `composedPath()`, with the following contexts:

```                  
event target      | propagationContexts
------------------|-----------------------------------
h2                | m                     m
slot              |  ls                  ls
slot              |   fs                fs
document-fragment |    fs              fs
frame-slot        |     ls            ls
document-fragment |      ls          ls
link-slot         |       m         m
div               |        m       m
body              |         m     m
html              |          m   m
document          |           m m
Window            |            m
======================================================
12 targets        | 8 context shifts
```

`h2.click()` produces the following `bouncedPath` (each line represent one propagation context):

```                  
PropagationContexts | event targets
--------------------|-----------------------------------
window:             | H2,LINK-SLOT,DIV,BODY,HTML,#document,window
  LINK-SLOT:        | SLOT,FRAME-SLOT,#document-fragment
    FRAME-SLOT:     | SLOT,#document-fragment
======================================================
2 context shifts    | 12 targets
```

`h1.click()` produces the following `composedPath()`, with the following contexts:

```                  
event target           | PropagationContexts
-----------------------|-----------------------------------------------------------
h1                     | i                                                       i
document-fragment      |  i                                                     i
inner-host             |   o                                                   o
slot                   |    ils                                               ils
slot                   |     ifs                                             ifs
document-fragment      |      ifs                                           ifs
inner-frame-slot       |       ils                                         ils
document-fragment      |        ils                                       ils
inner-link-slot        |         o                                       o
slot                   |          uils                                  uils
slot                   |           uifs                                uifs
document-fragment      |            uifs                              uifs
upper-inner-frame-slot |             uils                            uils
document-fragment      |              uils                          uils
upper-inner-link-slot  |               o                           o
document-fragment      |                o                         o
outer-host             |                 m                       m
span                   |                  m                     m
slot                   |                   ls                  ls
slot                   |                    fs                fs
document-fragment      |                     fs              fs
frame-slot             |                      ls            ls
document-fragment      |                       ls          ls
link-slot              |                        m         m
div                    |                         m       m
body                   |                          m     m
html                   |                           m   m
document               |                            m m
Window                 |                             m
=================================================================================
29 targets             | 27 context shifts
```

`h1.click()` produces the following `bouncedPath` (each line represent one propagation context):

```
PropagationContexts           | event targets
------------------------------|-----------------------------------
window:                       | OUTER-HOST,SPAN,LINK-SLOT,DIV,BODY,HTML,#document,window
  OUTER-HOST:                 | INNER-HOST,INNER-LINK-SLOT,UPPER-INNER-LINK-SLOT,#document-fragment
    INNER-HOST:               | H1,#document-fragment
    INNER-LINK-SLOT:          | SLOT,INNER-FRAME-SLOT,#document-fragment
      INNER-FRAME-SLOT:       | SLOT,#document-fragment
    UPPER-INNER-LINK-SLOT:    | SLOT,UPPER-INNER-FRAME-SLOT,#document-fragment
      UPPER-INNER-FRAME-SLOT: | SLOT,#document-fragment
  LINK-SLOT:                  | SLOT,FRAME-SLOT,#document-fragment
    FRAME-SLOT:               | SLOT,#document-fragment
======================================================
8 context shifts              | 29 targets
```


## References

*
