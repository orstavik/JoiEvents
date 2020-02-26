# WhatIs: `focus` events

The focus events is used to signal which interactive elements will receive the next `keypress` events. If a `<input>` or `<textarea>` has focus, then the next keypresses will fill that element with text. If an `<a href>` has focus, that element will trigger to the next "enter" or "space". 
 
There are four focus events:
1. `focus` and `blur`. Non-bubbling, sync events that is dispatched on an element that receives/looses focus.
2. `focusin` and `focusout`. *Bubbling* clones of `focus` and `blur`.

If in doubt, just use `focusin` and `focusout`. They are supported by all browsers today. 

## WhatIs: `.focus()`, `.blur()` and `document.activeElement`?

There can be only *one* element in the DOM that has focus at any one time. This element is the `document.activeElement`.

The `HTMLElement.blur()` removes the focus from an element. When no element is set to have focus, then `document.activeElement = document.body`. In principle, `.blur()` controls and dispatches the `blur` and `focusout` events.

`HTMLElement.focus()` adds focus to an element, and it sets the `document.activeElement` to equal the element on which focus was called. In principle, `.focus()` controls the `focus` and `focusin` events. 

In principle, this gives us the following sequence when focus is added to a new element.

1. `HTMLElement.blur()` is triggered on the element that looses focus.
   1. `document.activeElement = document.body`.
   2. `blur` event is dispatched to the previously focused element. 
   3. `focusout` event is dispatched to the previously focused element. 
2. `HTMLElement.focus()` is triggered on the element that gains focus.
   1. `document.activeElement =` the new focus element.
   2. `focus` event is dispatched to the new focus element. 
   3. `focusin` event is dispatched to the new focus element.
    
* `blur` before `focusout`, and `focus` before `focusin`. Age before beauty.

## What triggers `.focus()`?

The focus events are triggered and controlled from the `.focus()` method. But what user actions can trigger the `.focus()` method?

There are primarily two events that trigger `.focus()`:
 * `mousedown`
 * `keydown`

> `touchstart` does not trigger `.focus()` directly. `touchstart` triggers `mousedown` which triggers `.focus()`.

Be aware. Devtools and the focus event cascade does not play nice. Devtools takes focus in the browser window, and thus distorts the focus within the document. Pun intended. This causes devtools to a) dispatch one `blur`/`focus` event being dispatched on the `window` element when devtools is opened/the document is clicked when devtools used to have focus and b) sometimes (while loading) cancel event listeners for focus events during debugging. Or something along these lines.

## Demo: `mousedown` and `keydown` do `.focus()`?

```html
<input type="text" value="Hello sunshine!"/>
<input type="text" value="Hello world."/>

<script>
  function log(e) {
    console.log(e.target.id + "." + e.type);
    setTimeout(function () {
      console.log(document.activeElement.getAttribute("value"));
    });
  }

  window.addEventListener("mousedown", log);
  window.addEventListener("keydown", log);

  //.preventDefault() will block focus change for both events
  // window.addEventListener("mousedown", e => e.preventDefault()); 
  // window.addEventListener("keydown", e => e.preventDefault());

  //mousedown or keydown events dispatched from script will not trigger .focus()
  // one.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
  // window.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Tab", code: "Tab", /*...*/ keyCode: 9}));
</script>
```
 
 * To verify that focus has changed, we will check the `document.activeElement` from a `setTimeout()` after each trigger event. 
 * If we call `.preventDefault()` on `mousedown` or `keypress`, this will prevent the browser from calling `HTMLElement.focus()`. 
 * Only user generated events (.isTrusted) can change `.focus()`. Thus, calling `one.dispatch(new MouseEvent("mousedown"))` will not cause the focus to change.

## EdgeCase: `focus` and `focusin` together as one

The focus events are **sync**. This means that all the event listeners run first as a group, and then all the microtasks queued from within each event listener run.

But. This should apply per event only. Any microtask queued from an event listener for one event *should* run before the next event is dispatched.

And. This always applies to the `blur` and `focusout` event. Any microtask queued from `blur` will run *before* `focusout` is dispatched

And. This always applies when focus is shifted by a user-driven event such as `mousedown` or a "tab" `keypress`.

But. This is *not* the case when `.focus()` is triggered by script for `focus` and `focusin`. When you call `focus()` from script, then the event listeners for `focus` and `focusin` will run as a unit, and any microtask queued from a `focus` event listener will run *after* all the event listeners for `focusin` has been run. 

## Demo: `focus` and `focusin` twins

```html
<h3>click on the input fields to shift focus</h3>
<input type="text" value="Hello sunshine!"/>
<input type="text" value="Hello world"/>
<div>.focus() on sunshine!</div>

<script>
  (function () {
    console.log("Even while the document is loading, document.activeElement = ", document.activeElement);

    function log(e) {
      console.log(e.type + ": " + e.target.tagName);
      console.log("document.activeElement: " + document.activeElement.tagName);
      Promise.resolve().then(() => {
        console.log("microtask from previous " + e.type);
      });
    }

    window.addEventListener("focus", log, true);
    window.addEventListener("focusin", log, true);
    window.addEventListener("focusout", log, true);
    window.addEventListener("blur", log, true);

    const one = document.querySelector("input");
    const div = document.querySelector("div");
    div.addEventListener("click", function () {
      one.focus();
    });
  })();
</script>
```

* When you switch between the two input fields, you can see in the console which events are run in which order.
* If you have focus either on the document or the "Hello world." input field, and then click on ".focus() on sunshine!", you can see in the console the microtasks queued from `focus` and `focusin` being run together at the end. This has been tested in both Chrome and Firefox (feb 2020). 

## Demo 2: FocusController 

This demo illustrate the behavior of `focus()`, `blur()`, `document.activeElement` and the native focus event controller function.

1. The demo mirrors and exposes the behavior of `HTMLElement.focus()`, `HTMLElement.blur()`, and `document.activeElement`.
   * The behavior of `document.activeElement` cannot fully be exposed, as it controls pseudo classes a.o., so a naive `document.myActiveElement` property that resemble the `activeElement` property behavior is set up.
2. Then we turn off the triggers(default action) of focus events for mousedown and keypress.
3. Then we add a focus event controller function that listens for *two* events, `mousedown` and `keydown`. It then checks the value of these triggering events and decides to call `.blur()` and `.focus()` respectively. The FocusController is very naive, and implements only a fraction of the functionality for `keydown`. For example, `tabindex` is not supported, nor is the ability to focus on the addressbar and other browser buttons represented, devtools behaves strangely, and in essence all elements can be given focus.

```html
<style>
  .pseudo_my_focus {
    border: 2px solid orange;
  }
</style>

<h3>click on the input fields to shift focus</h3>
<input type="text" value="Hello sunshine!"/>
<input type="text" value="Hello world"/>
<div>.focus() on sunshine!</div>

<script>
  (function () {

    //1. turning off native call to .focus() for both native events
    window.addEventListener("mousedown", e => e.preventDefault(), true);
    window.addEventListener("keydown", e => e.key === "Tab" && e.preventDefault(), true);

    //2. monkey-patch the HTMLElement.focus(), .blur(), and  .focusNoTwin() methods to expose their behavior
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

    //3. focus event controller that listens for mousedown and keypress
    const FocusController = {
      onMousedown: function (e) {
        if (!e.isTrusted /*|| e.defaultPrevented*/)   //the check for preventDefault() must be turned off in this test, see 1
          return;
        setTimeout(() => document.myActiveElement.blur());
        setTimeout(() => e.target.focusNoTwin());
      },
      tabIndex: -1,
      onKeydown: function (e) {
        if (!e.isTrusted /*|| e.defaultPrevented*/)   //the check for preventDefault() is turned off in this test, see 1
          return;
        if (e.key !== "Tab")
          return;
        const inputTextareas = document.querySelectorAll("input, textarea, select, a"); //etc. etc.
        e.shiftKey ? FocusController.tabIndex-- : FocusController.tabIndex++;
        FocusController.tabIndex = FocusController.tabIndex % inputTextareas.length;
        const focusTarget = inputTextareas[FocusController.tabIndex];
        setTimeout(() => document.myActiveElement.blur());
        setTimeout(() => focusTarget.focusNoTwin());
      }
    };

    window.addEventListener("mousedown", FocusController.onMousedown, true);
    window.addEventListener("keydown", FocusController.onKeydown, true);
  })();

  function log(e) {
    console.log(e.type + ": " + e.target.tagName);
    console.log("document.myActiveElement: " + document.myActiveElement.tagName);
    Promise.resolve().then(() => {
      console.log("microtask from previous " + e.type);
    });
  }

  window.addEventListener("my-focus", log, true);
  window.addEventListener("my-focusin", log, true);
  window.addEventListener("my-focusout", log, true);
  window.addEventListener("my-blur", log, true);

  const one = document.querySelector("input");
  const div = document.querySelector("div");
  div.addEventListener("click", function () {
    one.focus();
  });
</script>
```

 <!--
todo make a chapter about the `tabindex` attributes as a means to control an event controller via the DOM.
 -->

## References

 * dunno