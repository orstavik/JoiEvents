# WhatIs: `input`?

The `input` event fires **after** the value of an `<input>`, `<select>`, or `<textarea>` element has changed. We call `<input>`, `<select>`, or `<textarea>` element here "input elements". 

The browser dispatches the `input` event **only** when the user has changed the input element via either **mouse, keyboard** or another input device. Att! `input` events are **not** dispatched when the element's value is changed by a **script**. Hence, changing the `.value` property on an input element object in JS will not trigger an `input` event.

The input event is **sync**. The `input` event is dispatched *immediately* after the DOM update of the element. This means that the `input` event *will be* the very first thing that happens after a *user-driven* change of the value of an input element. Hence, any task queued in the event loop from a `beforeinput` event listener, should run AFTER the input event dispatch. 

Unlike keyboard events, the `input` event is triggered by any changes in values, even those not related to keyboard actions: pasting text with a mouse or using speech recognition to dictate text. 

On the other hand, the `input` event is not triggered by typing from the keyboard and other actions that doesn't change the value of the input element, such as pressing the arrow keys during input or pressing "enter/new line" when the focus is on an `<input>`.

> The `input` event is similar to the [`change` event](WhatIs_change.md). The difference is that the `input` event occurs immediately after the value of the element has changed, and the `change` occurs when the element loses focus after the content has been changed.

## The `beforeinput` event

The `beforeinput` event is a newer addition to the `input` event cascade. The `beforeinput` event is dispatched **before** the mouse or keyboard input changes the value of the input elements. The sequence is:

    mouse or keyboard event -> beforeinput event -> change of the `.value` property of the input element in the DOM -> input event.

Furthermore, the action of changing the `.value` property on the input element is added as the default action of the `beforeinput` event. This means that if you call `.preventDefault()` on a `beforeinput` event, then the input element's value will not be changed and you will not get an `input` event neither. 

> `beforeinput` will be supported in Firefox 74.

## Demo: `input` and `beforeinput` event

```html
<input id="one" type="text" value="Tell us your story ...">
<input id="two" type="text" value="Nothing can stop you!">
<input id="three" type="text" value="Or could it?">

<script >
(function() {
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  const three = document.querySelector("#three");
  
  one.addEventListener("beforeinput", e => 
    console.log("When this message is printed, the input's value is NOT YET updated.")
  );
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

## Demo: Naive `KeypressInputController`

In the demo below a function `InputController` recreates the logic of the `input` event cascade. This is a simplified version of the browsers native input controller as it only handles normal letters and backspace. This demo doesn't support:
 * pasting and cutting text selections, and
 * mouse driven changes for `<select>` elements,
 * etc. etc. etc. 

1. Block the native `beforeinput` event to avoid duplicate character input.
2. The `toggleTick` function enablea queueing of events in the event loop.
3. The `InputController` listens for keydown and keypress events.
4. `Backspace` does not trigger a `keypress` event. Therefore, we use a `keydown` event listener to handle `Backspace`.
5. Once the `InputController` receives an appropriate trigger event, it
   1. creates and dispatches a new `my-beforeinput` event,
   2. updates the value of the current target, and
   3. creates and dispatches a new `my-input event`.

```html
<input type="text" value="I have mirrored input events"/>

<script>
  (function () {
    // block all native beforeinput events and stop their default actions
    // this also blocks all native input events indirectly
    window.addEventListener("beforeinput", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    function toggleTick(cb) {
      const details = document.createElement("details");
      details.style.display = "none";
      details.ontoggle = cb;
      document.body.appendChild(details);
      details.open = true;
      Promise.resolve().then(details.remove.bind(details));
      return {
        cancel: function () {
          details.ontoggle = undefined;
        },
        resume: function () {
          details.ontoggle = cb;
        }
      };
    }

    const InputController = {
      keypress: function (e) {
        toggleTick(function () {
          const beforeInputEvent = new InputEvent("my-beforeinput", {composed: true, bubbles: true, cancelable: true});
          e.target.dispatchEvent(beforeInputEvent);
          if (beforeInputEvent.defaultPrevented)
            return;
          e.target.value += e.key;
          const inputEvent = new InputEvent("my-input", {composed: true, bubbles: true, cancelable: true});
          inputEvent.key = e.key;
          e.target.dispatchEvent(inputEvent);
        });
      },
      // Backspace doesn't trigger a keypress. Thus, to implement backspace, we need to listen for the keydown event instead.
      keydown: function (e) {
        if (e.key !== "Backspace")
          return;
        toggleTick(function () {
          const beforeInputEvent = new InputEvent("my-beforeinput", {composed: true, bubbles: true, cancelable: true});
          e.target.dispatchEvent(beforeInputEvent);
          if (beforeInputEvent.defaultPrevented)
            return;
          e.target.value = e.target.value.substr(0, e.target.value.length - 1);
          const inputEvent = new InputEvent("my-input", {composed: true, bubbles: true, cancelable: true});
          inputEvent.key = e.key;
          e.target.dispatchEvent(inputEvent);
        });
      }
    };

    window.addEventListener("keydown", InputController.keydown, true);
    window.addEventListener("keypress", InputController.keypress, true);

    window.addEventListener("my-beforeinput", e => console.warn("my-beforeinput"));
    window.addEventListener("my-input", e => console.warn("my-input"));
    window.addEventListener("beforeinput", e => console.log("beforeinput"));    // is blocked
    window.addEventListener("input", e => console.log("input"));                // is blocked
    window.addEventListener("my-input", e => e.preventDefault());               // makes no difference
    //window.addEventListener("my-beforeinput", e => e.preventDefault());       // this will block dom changes and subsequent input event
  })();
</script>
```

You will see both the `my-beforeinput` and `my-input` events each time you set new values to the `<input>` element.

## References

 * [MDN: input event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event);
 * [MDN: beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event);