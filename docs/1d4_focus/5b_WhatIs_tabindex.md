# WhatIs: `tab-index` attribute?

 * https://medium.com/javascript-in-plain-english/what-is-the-javascript-nodeiterator-api-c4443b79b492
 * https://github.com/whatwg/html/issues/2071#issuecomment-263736022
```javascript
const treeWalker = Document.createTreeWalker(
   document.body,
   NodeFilter.SHOW_ELEMENT,
   { acceptNode: function(node) { return (node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP); } },
   false
);
const nextFocusableNode = treeWalker.nextNode();
```

## `tabindex` order

The `tabindex` attribute is used to control the order of focus shifts when the user "tab" around on the page. Every time the focus is shifted using "tab", the focus event controller checks its current tabindex, and then finds the next element in the tabindex order. 

The order of tabindex is:

1. `tabindex=1` and counting upwards until `tabindex=32767`.
2. All natively interactive elements and elements with `tabindex=0`, on equal footing.
 * If more than one element has the same `tabindex` attribute value equivalent, then they are ordered in tree-order top-left to bottom-right.
 * A `tabindex` attribute  with a non-number value is invalid and ignored. For example:
    * `<div tabindex="one">` is the same as `<div>`; and 
    * `<button tabindex="two">` is the same as `<button tabindex="0">` and `<button>`. 
 * Elements with `tabindex=-1` or another negative number are focusable, but not tab-able. This attribute value is used to explicitly remove interactive, focusable elements from the "tab" order. 

## Demo: the ups and downs of `tabindex`

```html
<style>
  :focus {
    border: 2px dotted red;
  }
</style>
<ol>
  <li><input type="text" value="no tabindex"/></li>
  <li><input tabindex="1" type="text" value="tabindex=1"/></li>
  <li><textarea tabindex="1">tabindex="1"</textarea></li>
  <li><div tabindex="1">tabindex="1"</div></li>
  <li><div tabindex="-1">tabindex="-1"</div></li>
  <li><div tabindex="-2">tabindex="-2"</div></li>
  <li><div tabindex="0">tabindex="0"</div></li>
  <li><div tabindex="z">tabindex="z" (is not included in the list, since it is not a valid number)</div></li>
  <li><div tabindex="1000">tabindex="1000"</div></li>
  <li>
    <select id="no_tabindex">
      <option value="a">hello world!</option>
    </select>
  </li>
  <li><button>wait 3sec and then move all the other elements behind this element</button></li>
</ol>
<script>
  window.addEventListener("focusin", e => console.log(e.target.outerHTML));

  document.querySelector("button").addEventListener("click", function () {
    setTimeout(function () {
      const ol = document.querySelector("ol");
      for (let child of ol.children) {
        if (child.children[0] !== document.activeElement)
          ol.appendChild(child);
        else
          console.log(child);
      }
    }, 3000);
  });
</script>
```

In the demo above we focus on how `tabindex` behaves in the dynamic DOM.
1. When an element is removed from the DOM, even temporarily, it will loose focus. This will essentially reset the tabindex sequence. 
2. But, if other elements in the tabindex sequence are moved either above or below the `activeElement` in the DOM, these movements will be reflected in the next "tab".
 
The tabindex sequence responds to the DOM dynamically, ie. it holds no state outside the `activeElement` and the DOM.

## Interactive content

Some native elements react to certain events. These elements are referred to as ["interactive content"](https://html.spec.whatwg.org/multipage/dom.html#interactive-content-2). Most commonly, such interactive elements react when the user `click`s on them ("clickable elements"), but they can also respond to `keypress` enter, `wheel`, and other events.

Elements that can gain focus are considered interactive. This means that all the native element types that have their own reactions to user events *and* focusable elements with a valid `tabindex` attribute are interactive. But, as described above, non The functions below finds all interactive elements that are focusable or tab-able: 

```javascript
function interactiveElements(doc, tabbableOnly) {
  const interactiveTypes = "a[href], audio[controls], button, details, embed, iframe, img[usemap], input:not([type='hidden']), label, object[usemap], select, textarea, video[controls]";
  const hardcore = Array.from(doc.querySelectorAll(interactiveTypes));
  const interactive = Array.from(doc.querySelectorAll(interactiveTypes + ", [tabindex]"));
  return interactive.filter(el => {
      const tabindex = parseInt(el.getAttribute("tabindex"));
      if (isNaN(tabindex) && hardcore.indexOf(el) === -1)
        return false;
      if (tabbableOnly && tabindex < 0)
        return false;
      return true;
    });
}
```
                                                                         
## Demo: `FocusController` using `tabindex`

The `tabindex` is essentially a set of directives for how the `FocusController` should respond to `keypress`. As the DOM is dynamic, the `FocusController` must recalculate the next tab-able element based on the `tabindex` and position of the `activeElement` in the DOM anew every time.

Below is a demo that builds on the previous `FocusController` from the previous chapter, but that also:
1. adds a listener for `keypress` events that 
2. checks the `tabindex` values in the DOM using the
3. `interactiveElements(doc, tabbableOnly)` function.

```html
<style>
  .pseudo_my_focus {
    border: 2px dotted red;
  }
</style>
<ol>
  <li><input type="text" value="no tabindex"/></li>
  <li><input tabindex="1" type="text" value="tabindex=1"/></li>
  <li><textarea tabindex="1">tabindex="1"</textarea></li>
  <li>
    <div tabindex="1">tabindex="1"</div>
  </li>
  <li>
    <div tabindex="-1">tabindex="-1"</div>
  </li>
  <li>
    <div tabindex="-2">tabindex="-2"</div>
  </li>
  <li>
    <div tabindex="0">tabindex="0"</div>
  </li>
  <li>
    <div tabindex="z">tabindex="z" (is not included in the list, since it is not a valid number)</div>
  </li>
  <li>
    <div tabindex="1000">tabindex="1000"</div>
  </li>
  <li>
    <select id="no_tabindex">
      <option value="a">hello world!</option>
    </select>
  </li>
  <li>
    <button>wait 3sec and then move all the other elements behind this element</button>
  </li>
</ol>
<script>
  (function () {

    //1. monkey-patch the HTMLElement.focus(), .blur(), and  .focusNoTwin() methods to expose their behavior
    HTMLElement.prototype.blur = function () {
      const previousFocus = document.myActiveElement;
      document.myActiveElement = document.body;
      if (previousFocus === undefined || previousFocus === document.myActiveElement)
        return;
      setTimeout(() => previousFocus.dispatchEvent(new FocusEvent("my-blur", {composed: true, bubbles: false})));
      setTimeout(() => previousFocus.dispatchEvent(new FocusEvent("my-focusout", {composed: true, bubbles: true})));
    };

    HTMLElement.prototype.focus = function () {
      document.myActiveElement = this;
      this.dispatchEvent(new FocusEvent("my-focus", {composed: true, bubbles: false}));
      this.dispatchEvent(new FocusEvent("my-focusin", {composed: true, bubbles: true}));
    };

    HTMLElement.prototype.focusNoTwin = function () {
      document.myActiveElement = this;
      setTimeout(() => this.dispatchEvent(new FocusEvent("my-focus", {composed: true, bubbles: false})));
      setTimeout(() => this.dispatchEvent(new FocusEvent("my-focusin", {composed: true, bubbles: true})));
    };

    //2b. add setter and getter for myActiveElement to mirror the behavior of activeElement
    Object.defineProperty(HTMLDocument.prototype, "myActiveElement", {
      get: function () {
        return this._myActiveElement || this.body;
      },
      set: function (el) {
        this._myActiveElement && this._myActiveElement.classList.remove("pseudo_my_focus");
        this._myActiveElement = el;
        el.classList.add("pseudo_my_focus");
      }
    });

    function interactiveElements(doc) {
      const interactiveTypes = "a[href], audio[controls], button, details, embed, iframe, img[usemap], input:not([type='hidden']), label, object[usemap], select, textarea, video[controls]";
      const hardcore = Array.from(doc.querySelectorAll(interactiveTypes));
      const interactive = Array.from(doc.querySelectorAll(interactiveTypes + ", [tabindex]"));
      return interactive.filter(el => hardcore.indexOf(el) >= 0 || !isNaN(parseInt(el.getAttribute("tabindex"))));
    }

    function tabbableElements(doc) {
      const interactiveTypes = "a[href], audio[controls], button, details, embed, iframe, img[usemap], input:not([type='hidden']), label, object[usemap], select, textarea, video[controls]";
      const hardcore = Array.from(doc.querySelectorAll(interactiveTypes));
      const interactive = Array.from(doc.querySelectorAll(interactiveTypes + ", [tabindex]"));
      return interactive.filter(el => hardcore.indexOf(el) >= 0 || parseInt(el.getAttribute("tabindex")) >= 0);
    }

    function sortTabindex(tabbables) {
      return tabbables.sort((a, b) => {
        const A = parseInt(a.getAttribute("tabindex")) || 0;
        const B = parseInt(b.getAttribute("tabindex")) || 0;
        if (A === B)
          return 0;
        if (B === 0)
          return -1;
        if (A === 0)
          return 1;
        return A > B ? 1 : -1;
      });
    }

    //2. turning off native call to .focus() for both native events
    window.addEventListener("mousedown", e => e.preventDefault(), true);
    window.addEventListener("keydown", e => e.key === "Tab" && e.preventDefault(), true);

    //3. focus event controller that listens for mousedown and keypress
    const FocusController = {
      onMousedown: function (e) {
        if (!e.isTrusted /*|| e.defaultPrevented*/)   //preventDefault() cannot be checked in this test, see 2.
          return;
        if (!interactiveElements(document).indexOf(e.target) && e.target !== document.body)
          return;
        setTimeout(() => document.myActiveElement.blur());
        setTimeout(() => e.target.focusNoTwin());
      },
      onKeydown: function (e) {
        if (!e.isTrusted /*|| e.defaultPrevented*/)   //preventDefault() cannot be checked in this test, see 2.
          return;
        if (e.key !== "Tab")
          return;
        const tabbables = tabbableElements(document);
        let focusTarget;
        if (tabbables.indexOf(document.myActiveElement) === -1) {
          const position = tabbables.findIndex(node => document.myActiveElement.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
          focusTarget = tabbables[position];
        } else {
          let position = sortTabindex(tabbables).indexOf(document.myActiveElement);
          e.shiftKey ? position-- : position++;
          position = position % tabbables.length;
          focusTarget = tabbables[position];
        }
        setTimeout(() => document.myActiveElement.blur());
        setTimeout(() => focusTarget.focusNoTwin());
      }
    };

    window.addEventListener("mousedown", FocusController.onMousedown, true);
    window.addEventListener("keydown", FocusController.onKeydown, true);
  })();
</script>
<script>
  window.addEventListener("focusin", e => console.log(e.target.outerHTML));

  document.querySelector("button").addEventListener("click", function () {
    setTimeout(function () {
      const ol = document.querySelector("ol");
      const children = Array.from(ol.children);
      for (let child of children) {
        if (child.children[0] !== document.myActiveElement)
          ol.appendChild(child);
        else
          console.log(child);
      }
    }, 3000);
  });
</script>
``` 

## References

 * [WHATWG: The tabindex attribute](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute)
