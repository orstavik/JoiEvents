# WhatIs: `beforeinput` and `input` events?

The `beforeinput` event propagates **before** a mouse or keyboard input changes the value of the input elements; the `input` event propagates **after** the state change. The sequence is:

    -> mouse or keyboard event  
     -> beforeinput event 
      -> change of the `.value` property of the input element in the DOM
       -> input event.

## The `beforeinput` event

The `beforeinput` event is dispatched **before** the following properties of native input elements will change:
1. the `.value` property an `<input type="text">`
2. the `.checked` property an `<input type="checkbox">`
3. the `.value` property a `<textarea>`
4. the `.selectedIndex` property of a `<select>`
* and several other properties to different input elements such as `<input type="radiobox, date, ...">` etc.

The `beforeinput` event is **future-tense**. This means that the `beforeinput` event describes a state change that is about to be performed. If you call `.preventDefault()` on the `beforeinput` event, this state change will be cancelled. (The `beforeinput` event is therefore `cancelable: false`.)

The `beforeinput` event is triggered **only** by **user-driven** state changes, and not **script-driven** state changes. This means that the state change must be effected directly by a user event such as a `click`, `keypress`, or similar. The trigger events must be `.isTrusted = true`: it is not possible to bypass this criteria by for example dispatching `MouseEvent` created by a script. (Many different user-driven events can trigger `beforeinput`: keyboard, mouse, speech recognition, cut'n'paste, and text composition.)

But. `beforeinput` events are not triggered by keyboard events and other user actions that doesn't change the value of the input element: pressing the arrow keys during input or pressing "enter/new line" when the focus is on an `<input>` will not trigger a `beforeinput` event.

The "beforeinput-task", ie. the task that dispatches the `beforeinput` event, runs immediately after the propagation of the trigger event has finished. For example, if you `click` on an `<input type="checkbox">`, this will create a task that dispatches a `beforeinput` event that `target` this input element. This beforeinput-task functions as the default action for the preceding `click` event. 

The `beforeinput` event is **sync**. This means that any micro-task queued from a `beforeinput` event listener will be run after the propagation of the `beforeinput` event has concluded (after all the `beforeinput` event listeners has run). But, these microtask queue from `beforeinput` event listeners run *before* the value on the input element is updated.

The `beforeinput` event is a newer addition to the `input` event cascade (Firefox 74 will support `beforeinput` by default). When `beforeinput` is not supported, the state change of the input element can be prevented by calling `preventDefault()` on the user-driven event preceding the `beforeinput`, such as `click` or `keypress`.

## The `input` event

The `input` event is dispatched **after** the following properties of native input elements has changed:
1. the `.value` property an `<input type="text">`
2. the `.checked` property an `<input type="checkbox">`
3. the `.value` property a `<textarea>`
4. the `.selectedIndex` property of a `<select>`
* and several other propertis to different input elements such as `<input type="radiobox, date, ...">` etc.

The `input` event is **past-tense**. This means that the `input` event describes a state change that has already occured/is completed. Calling `.preventDefault()` on `input` therefore has no effect (and would make no sense), and the `input` event is therefore `cancelable: false`.

The `input` event is dispatched **only** when the state of the DOM is announced by a `beforeinput` event (or equivalent user-driven event in older browsers). You might have a `beforeinput` event without an `input` event (ie. when the `beforeinput` is prevented), but you can never have an `input` event that is not preceded by a `beforeinput`. The `input` event is **not** dispatched when the element's property value is changed by a **script**. Thus, only a `UIEvent` that is `.isTrusted = true` can indirectly trigger the `input` event.

The input event is queued **sync**. The `input` event is dispatched *immediately* after the property of the input element has changed. This means that if the `beforeinput` event is not prevented, the `input` event *must be* the very first event to follow it:
1. The task that alters the value property is the default action of `beforeinput` event (and therefore runs sync after it has completed its propagation). 
2. The task of dispatching the `input` event runs sync/immediately after the input element has changed its state (when it was initiated by a `beforeinput` event).

## Demo: `input` and `beforeinput` event

```html
<input id="one" type="text" value="Tell us your story ...">
<input id="two" type="text" value="Nothing can stop you!">
<input id="three" type="text" value="Or could it?">

<script>
  (function () {
    const one = document.querySelector("#one");
    const two = document.querySelector("#two");
    const three = document.querySelector("#three");

    one.addEventListener("beforeinput", e => {
      const beforeValue = e.target.value;
      console.log("When this message is printed, the input's value is NOT YET updated.");
      Promise.resolve().then(function () {
          console.log("Microtasks queued from beforeinput event listener runs BEFORE the input value is updated: " +
            (beforeValue === e.target.value)
          );
        }
      );
    });
    one.addEventListener("input", e =>
      console.log("When this message is printed, the input's value HAS BEEN updated.")
    );
    two.addEventListener("input", e => e.preventDefault());
    // the text is updated in the DOM, the input event is dispatched AFTER the DOM is updated.
    three.addEventListener("beforeinput", e => e.preventDefault());
    // you try to make changes to input #three, but you can't.
  })();
</script>
```

## Demo: `<input type="text">` with default actions

In the demo below we add default actions to the `<input type="text">` element to enable it to react to `keypress`/`keydown` events. This is a simplified version of the browsers native `<input type="text">` element. This demo doesn't support:
 * pasting and cutting text selections, and
 * mouse driven changes for `<select>` elements,
 * etc. etc. etc. 

```html
<script src="../../1d3_defaultAction/demo/addDefaultAction.js"></script>
<script>
  (function () {
    class MyInput extends HTMLElement {

      static get observedAttributes() {
        return ["value"];
      }

      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<div tabindex="0" style="border: 1px solid grey; width: 200px; height: 1.2em;"></div>`;
        this._innerDiv = shadow.children[0];
      }

      get value() {
        return this._innerDiv.innerText;
      }

      set value(newValue) {
        this._innerDiv.innerText = newValue;
      }

      attributeChangedCallback(name, oldValue, newValue) {
        //The browser can implicitly detect if an element was constructed with a value attribute at startup.
        //Regular JS functions cannot, so instead we add an explicit attribute (_value_at_startup_) to flag this state.
        if (name === "value" && !this.hasAttribute("_value_at_startup_")) {
          this.value = newValue;
        }
      }

      _native_reset() {
        this.value = this.getAttribute("value");
      }

      _native_requestInput(data) {
        let insertType = "insertText";
        if (data === "Backspace") {
          insertType = "deleteContentBackward";
          data = null;
        }
        const beforeInputEvent = new InputEvent("my-beforeinput", {
          composed: true,    //composed should be false
          bubbles: true,
          cancelable: true,
          insertType,
          data,
        });
        this.dispatchEvent(beforeInputEvent);
        // Event listeners in the propagation above might queue microtasks.
        // These microtasks should be emptied before _native_updateValue is called.
        // To delay updating the state properly until these microtasks are run, we use toggleTick.
        toggleTick(() => {
          if (!beforeInputEvent.defaultPrevented)
            this._native_updateValue(data, insertType);
        }, ["keypress"]);   //keydown might trigger keypress.
      }

      //simplified
      _native_updateValue(data, insertType) {
        if (insertType === "deleteContentBackward")
          this._innerDiv.innerText = this._innerDiv.innerText.substr(0, this._innerDiv.innerText.length - 1);
        else
          this._innerDiv.innerText += data;
        const inputEvent = new InputEvent("my-input", {
          composed: true,   //composed should be false
          bubbles: true,
          cancelable: true,
          data,
          insertType
        });
        this.dispatchEvent(inputEvent);
      }

      _native_requestChangeStart() {
        this._previousValue = this.value;
      }

      _native_requestChange() {
        if (this._previousValue === this.value)
          return;
        const myChangeEvent = new Event("my-change", {composed: false, bubbles: true, cancelable: false});
        this.dispatchEvent(myChangeEvent);
      }
    }

    customElements.define("my-input", MyInput);
  })();

  function firstInPath(path, query) {
    for (let element of path) {
      if (element instanceof HTMLElement && element.matches(query))
        return element;
    }
    return null;
  }

  window.addEventListener("keypress", function (e) {
    if (e.key === "Enter")
      return;
    const el = firstInPath(e.composedPath(), "my-input");
    if (el)
      e.addDefaultAction(el._native_requestInput.bind(el, e.key), {preventable: el});
  }, true);


  window.addEventListener("keydown", function (e) {
    if (e.key !== "Backspace")
      return;
    const el = firstInPath(e.composedPath(), "my-input");
    if (el)
      e.addDefaultAction(el._native_requestInput.bind(el, e.key), {preventable: el});
  }, true);
</script>

<my-input id="one" type="text" value="Tell us your story ..."></my-input>
<my-input id="two" type="text"></my-input>
<my-input id="three" type="text" value="Or could it?"></my-input>

<script>
  (function () {
    const one = document.querySelector("#one");
    const two = document.querySelector("#two");
    const three = document.querySelector("#three");

    one.addEventListener("my-beforeinput", e => {
      const beforeValue = e.target.value;
      console.log("When this message is printed, the input's value is NOT YET updated.");
      Promise.resolve().then(function () {
          console.log("Microtasks queued from my-beforeinput event listener runs BEFORE the input value is updated: " +
            (beforeValue === e.target.value)
          );
        }
      );
    });
    one.addEventListener("my-input", e =>
      console.log("When this message is printed, the input's value HAS BEEN updated.")
    );
    two.addEventListener("my-input", e => e.preventDefault());
    // the text is updated in the DOM, the input event is dispatched AFTER the DOM is updated.
    three.addEventListener("my-beforeinput", e => e.preventDefault());
    // you try to make changes to input #three, but you can't.
  })();
</script>
```

You will see both the `my-beforeinput` and `my-input` events each time you set new values to the `<my-input>` element.

> The `input` event is similar to the [`change` event](WhatIs_change.md). The difference is that the `input` event occurs immediately after the value of the element has changed, and the `change` occurs when the element loses focus after the content has been changed.

## References

 * [MDN: input event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event);
 * [MDN: beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event);