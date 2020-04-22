# WhatIs: focus?

Simply put, **the element in focus**:
1. is the element that will **receive keyboard events**,
2. has the **`:focus`** CSS pseudo-class, and
3. is the **`document.activeElement`**.

However, when used in CSS and JS there are some more nuances that you need to be aware of. Here they are.

## WhatIs: `:focus` and `:focus-within`?

The `:focus` is a CSS pseudo-class that enable the CSS developer to add custom style to the element in focus. For example, Chrome adds an orange border around input elements who has `:focus` by default. `:focus` points exclusively to `document.activeElement`.

"The `:focus-within` CSS pseudo-class represents an element that has received focus or contains an element that has received focus. ... (This includes descendants in shadow trees.)" [MDN: `:focus-within`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within). If an element `.contains()` the `document.activeElement`, that element has `:focus-within`. Note, that this includes the `document.activeElement` itself. Hence, if an element with `:focus`, it will also always have `:focus-within`.

## HowTo: read `:focus` and `:focus-within` elements from JS?  

In CSS, the `:focus` and `:focus-within` can be read directly. But, in JS, there is no direct equivalents to read neither the `:focus` nor `:focus-within`. 

Often, the `:focus` element equals the `document.activeElement`. But, if the `:focus` element is hidden inside a `closed` shadowRoot, then the `:focus` element equals `closedShadowRoot.activeElement`. And, you might not know whether or not your DOM context is inside a `closed` `shadowRoot`, and so you need to use an element in your DOM context as a starting point: `node.getRootNode().activeElement`. From the JS context, you cannot know if an element has a `closed` shadowRoot that is given `focus`. To test for this require computing the style, so you only want to do this during development, not in production.

```javascript
// Development only means to read the CSS :focus property.
// Be aware that the `document.activeElement` is not always the element in `:focus`.
function elementHasFocus(element){
  let root = element.getRootNode();
  const style = document.createElement("style");
  style.textContent = ":focus{--this-is-just-a:test;}";
  (root !== document ? root : root.body).appendChild(style);
  const active = root.activeElement;
  const activeStyle = getComputedStyle(active).getPropertyValue("--this-is-just-a");
  style.remove();
  return activeStyle === "test";
}

// From the context of an event listener, an event's target doesn't always 
// represent the deepest-most element in the propagation path. 
// When an element propagates out of an open shadowDOM, 
// then the event's target is re-targeted to the shadowDOMs host node, 
// while the composedPath remains unaltered.
function getRootTarget(e){
  return e.composedPath()[0];
}

// document.activeElement is not good enough when you are writing web components.
// if you are inside an event listener within a web component, and 
// this web component either has a closed shadowRoot (which you can foresee and control)
// or is used inside another web component with a closed shadowRoot 
// (which you cannot foresee nor control), then document.activeElement 
// will yield a different and likely useless result than getContextDocument(e).activeElement.
//  
// getRootNode() returns either the first closed shadowRoot document fragment 
// or the main document, whichever comes first in the elements ancestor path.
// Ie. getRootNode() does not "stop" on open shadowRoots.
function getContextDocument(e){
  return e.target.getRootNode();
}
  
function hasFocusWithin(node){
  return node instanceof Node && node.contains(node.getRootNode().activeElement);
}

function getComposedPath(target, composed) {
  const path = [];
  while (true) {
    path.push(target);
    if (target.parentNode) {
      target = target.parentNode;
    } else if (target.host) {
      if (!composed)
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

anElement.addEventListener("event", function(e){
  const contextDocument = getContextDocument(e); 
  // if anElement resides inside a closed shadowDOM, then contextDocument !== document.
  const contextActiveElement = contextDocument.activeElement;
  const focusWithinElements = getComposedPath(contextActiveElement, true);
  console.log("contextActiveElement has ':focus'? " + elementHasFocus(contextActiveElement));
});
```

## Demo: Where is `:focus-within` specified in web components?  

```html
<script>
  class OpenComp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host, slot {display: block;}
          * { border: 5px solid yellow; margin: 5px }
          :focus{ border-left-color: red; }
          :focus-within{ border-right-color: orange; }
        </style>
        <div class="shadowRoot imitator">
          shadowRoot open
          <div tabindex="0"> an open mind </div>
          <slot></slot>
        </div>
      `;
      this.shadowRoot.addEventListener("focusin", e => console.log(document.activeElement.tagName, e.target, e.composedPath()[0].innerText));
    }
  }

  class ClosedComp extends HTMLElement {
    constructor() {
      super();
      const shadowRoot = this.attachShadow({mode: "closed"});
      shadowRoot.innerHTML = `
        <style>
          :host, slot {display: block; }
          * { border: 5px solid lightgreen; margin: 5px; }
          :focus{ border-left-color: red; }
          :focus-within{ border-right-color: darkgreen; }
        </style>
        <div class="shadowRoot imitator">
          shadowRoot closed
          <div tabindex="0"> a closed mind </div>
          <slot></slot>
        </div>
      `;
      shadowRoot.addEventListener("focusin", e => console.log(document.activeElement.tagName, e.target, e.composedPath()[0].innerText));
    }
  }

  customElements.define("open-comp", OpenComp);
  customElements.define("closed-comp", ClosedComp);

  window.addEventListener("focusin", e => console.log(document.activeElement.tagName, e.target, e.composedPath()[0].innerText));
</script>
body
<style>
  * { border: 5px solid grey; margin: 5px }
  :focus { border-left-color: red; }
  :focus-within { border-right-color: blue; }
</style>
<div tabindex="0">hello sunshine</div>
<open-comp>
  <div tabindex="0">hello world</div>
  <closed-comp>
    <div tabindex="0">hello complexity</div>
  </closed-comp>
</open-comp>
```

As the demo above shows, it can be tricky to keep track of which elements belong to/are styled from which document when web components are nested deep. But, it is clear for the demo, that only the `document.activeElement` has `:focus`. The host nodes that contain the `document.activeElement` internally are not marked as having `:focus` in their DOM context, even when the `document.activeElement` is not visible from their DOM context.  

## References

 * 