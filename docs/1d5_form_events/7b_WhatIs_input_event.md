# WhatIs: `beforeinput` and `input` event?

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

> The `input` event is similar to the [`change` event](WhatIs_change.md). The difference is that the `input` event occurs immediately after the value of the element has changed, and the `change` occurs when the element loses focus after the content has been changed.

## References

 * [MDN: input event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event);
 * [MDN: beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event);