## The `_native_checkChange()` and `change` event

The `change` event is dispatched from the `_native_checkChange()` method on the `<input type="text">` element. The `change` event is past-tense: it follows a *group of* state changes to the `.value` property and is dispatched when the `<input type="text">` element *looses focus*. Calling `preventDefault()` on the `input` event does nothing.

The purpose of the `change` event is to provide a simplified hook for a series of `input` events. When a user updates a text input, he will often write tens or maybe hundreds of characters, make mistakes, edits, etc. within a short period of time. Most observations of `<input type="text">` elements require only that the script reacts when the user has *finished writing* and *moves onto* the next field. `change` is triggered by the `focusout` event, which is works as a proxy for "finished writing".



# WhatIs: `change` event?

The `change` event is dispatched:
1. just as an input element looses focus when
2. the state of that input element has changed by a user-driven action
3. since the element gained focus.

The `change` event is **past-tense**. The `change` event only describes a state change that has already occurred/is completed. It is more retrospective and built for observation/reaction, not prevention. `change` is `cancelable: false` with an empty `.preventDefault()` function.

The `change` event is **only** dispatched when:
1. A state change of the input element is announced by an `input` event. Thus, at least one `.isTrusted = true` user-driven event must occur for a `change` event to occur. The `change` event is **not** dispatched when the element's property value is *only* changed by **scripts**.
2. When the state of the input element changes from the start to the end of a focus session. A focus session is the period that passes between the time the element gains focus until the element looses focus. For example, if a text input gains focus, "a" is added to the end of its `.value`, a "Backspace" removes that "a" character again, and then the text input looses focus, then no `change` event will be dispatched on the text input.

The `change` event works as if it is queued **sync**: it is not possible to queue a task in between the `focusout` and the `change` event. The `change` event most likely runs **sync** too:  The `input` event is dispatched *immediately* after the property of the input element has changed. This means that if the `beforeinput` event is not prevented, the `input` event *must be* the very first event to follow it:
1. The task that alters the value property is the default action of `beforeinput` event (and therefore runs sync after it has completed its propagation). 
2. The task of dispatching the `input` event runs sync/immediately after the input element has changed its state (when it was initiated by a `beforeinput` event).



> todo use focusin instead of focusout in the demo.
> todo select change events are dispatched before the mouseup (and click), while checkbox and radiobutton change events are dispatched after the (mouseup and) click. 

The change event is fired for `<input>`, `<select>`, and `<textarea>` elements (hereafter: input elements) when an alteration to the element's value is "committed" by the user.

What "committing" means for the browser is a bit nuanced:
1. For `<select>`, `<input type="checkbox">`, and `<input type="radio">` elements, each change is a commit. This means that for these types of input elements, the `change` event occurs immediately after each `input` event. Here, "committing" is to "make an input".
2. For `<input type="text">` and `<textarea>` elements, the change is not complete and committed until the user is finished typing. The browser interprets this to be the time when the user switches focus away from the input element. Here, "committing" is to "change focus".
3. For `<input type="text">` elements can also loose focus when a form is directly submitted by the user pressing enter when they are in focus. This will cause the browser to directly submit the form. Here, "committing" is to "submit".

Thus, for `<select>`, `<input type="checkbox">`, and `<input type="radio">` elements `change` more or less equals `input`. But for `<input type="text">` and `<textarea>` `change` and `input` differs. Here, the `input` event is triggered for every change of an input elements value. This means that while you are writing you name and address in a form, as many as several hundred input events may be dispatched if you have a long name, or very bad touch typing skills. The `change` event on the other hand will only trigger once, when you move the focus away from that form input element or directly submit it.

> Change event is not cancelable because it is activated after entering new characters in the input field. Also, you cannot prevent a change event from occuring if the input elements values are changed by the user.  

## Demo: `change`

```html
<form id="normalForm">
  <input id="normalText" type="text" value="type something ...">
  <textarea id="normalTextarea">type something else</textarea>
  <select id="normalSelect">
    <option value="a">a</option>
    <option value="b">b</option>
    <option value="c">c</option>
  </select>
  <input id="normalCheckbox" type="checkbox">

  <label for="radioOne">one</label><input id="radioOne" type="radio" name="group1">
  <label for="radioTwo">two</label><input id="radioTwo" type="radio" name="group1">
</form>

<script>
  window.addEventListener("mouseup", e => console.log("mouseup ", e.target.id));
  window.addEventListener("click", e => console.log("click ", e.target.id));
  window.addEventListener("input", e => console.log("input ", e.target.id));
  window.addEventListener("change", e => console.log("change ", e.target.id));
  window.addEventListener("focusout", e => console.log("focusout ", e.target.id));
  window.addEventListener("submit", e => console.log("submit ", e.target.id));
</script>
```

## Demo: `ChangeController`

To capture the change events for `<select>`, `<input type="checkbox">`, and `<input type="radio">` elements, we simply need to listen for their `input` events and then queue a `change` event whenever they occur.

To capture the change events for `<input type="text">` and `<textarea>` elements, we instead listen for `focusin` and `focusout` events for these elements only. When the value of the input element has changed in the period when it had focus, then a `change` event is dispatched just before the element looses focus. Be aware that the `change` event occurs *before* the `focusout` or `submit` event, and that we to achieve this effect the demo below dispatches the `change` event synchronously from the early bird event listener on the `focusout` event.

```html
<form>
  <input id="normalText" type="text" value="type something ...">
  <textarea id="normalTextarea">type something else</textarea>
  <select id="normalSelect">
    <option value="a">a</option>
    <option value="b">b</option>
    <option value="c">c</option>
  </select>
  <input id="normalCheckbox" type="checkbox">

  <label for="radioOne">one</label><input id="radioOne" type="radio" name="group1">
  <label for="radioTwo">two</label><input id="radioTwo" type="radio" name="group1">
</form>

<script>
  (function () {
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

    const ChangeController = {
      target: undefined,
      value: undefined,

      input: function (e) {
        if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT" && e.target.type !== "text") {
          toggleTick(() => {
            const changeEvent = new InputEvent("my-change", {composed: true, bubbles: true, cancelable: true});
            e.target.dispatchEvent(changeEvent);
            ChangeController.target = undefined;
            ChangeController.value = undefined;
          });
        }
      },
      focusin: function (e) {
        if ((e.target.tagName === "INPUT" && e.target.type === "text") || e.target.tagName === "TEXTAREA") {
          ChangeController.target = e.target;
          ChangeController.value = e.target.value;
          window.removeEventListener("focusin", ChangeController.focusin, true);
          window.addEventListener("focusout", ChangeController.focusout, true);
          window.addEventListener("submit", ChangeController.focusout, true);
        }
      },
      focusout: function (e) {
        window.removeEventListener("focusout", ChangeController.focusout, true);
        window.removeEventListener("submit", ChangeController.focusout, true);
        window.addEventListener("focusin", ChangeController.focusin, true);
        if (ChangeController.value === e.target.value)
          return;
        const changeEvent = new InputEvent("my-change", {composed: true, bubbles: true, cancelable: true});
        //no toggle tick here, because the change event should run before the focusout event.
        ChangeController.target.dispatchEvent(changeEvent);
        ChangeController.target = undefined;
        ChangeController.value = undefined;
      }
    };

    window.addEventListener("focusin", ChangeController.focusin, true);
    window.addEventListener("input", ChangeController.input, true);
  })();

  window.addEventListener("input", e => console.log("input ", e.target.id));
  window.addEventListener("change", e => console.log("change ", e.target.id));
  window.addEventListener("focusout", e => console.log("focusout ", e.target.id));
  window.addEventListener("submit", e => console.log("submit ", e.target.id));
  window.addEventListener("my-change", e => console.log("my-change ", e.target.id));
</script>                                            ゛
```

## References

1. [MDN: change event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event);
2. [MDN: beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event)
 