# WhatIs: `change` event?

The `change` event is dispatched when the user has completed a "full state change" of an `<input>`, `<select>`, or `<textarea>` element (here: input elements). This means *two* different things:

For `<textarea>` and `<input type="text">` (here: text input elements) a "user-driven full state change":
1. begins when the text input element gains focus (ie. `focusin` event),
2. ends just before the text input element looses focus (which either means a corresponding `focusout` event or when an indirect `click` event is generated on the `<form>` parent when enter is pressed while focus in on an `<input type="text">` element),
3. the `.value` of the text input element has changed during the time when the element had focus, and
4. at least one event that was part of these changes was driven by the user (ie. at least one `input` event was dispatched at the text input element while it had focus).  

For `<select>` element and other `<input>` element types, a "user-driven full state change" is simply the same as an `input` event. For these types of input elements, the `change` event simply occurs immediately after each `input` event.

## Demo: `change` events

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
  <input type="submit" id="submit">
</form>

<script>
  window.addEventListener("submit", e => e.preventDefault());

  window.addEventListener("mousedown", e => console.log(e.type, e.target.id));
  window.addEventListener("mouseup", e => console.log(e.type, e.target.id));
  window.addEventListener("click", e => console.log(e.type, e.target.id));
  window.addEventListener("keypress", e => console.log(e.type, e.target.id));
  window.addEventListener("input", e => console.log(e.type, e.target.id));
  window.addEventListener("submit", e => console.log(e.type, e.target.id));
  document.addEventListener("focus", e => console.log(e.type, e.target.id), true);
  window.addEventListener("focusin", e => console.log(e.type, e.target.id));
  document.addEventListener("blur", e => console.log(e.type, e.target.id), true);
  window.addEventListener("focusout", e => console.log(e.type, e.target.id));

  //test showing change event is run async
  document.addEventListener("change", e => console.log(e.type + " from document listener", e.target.id));
  document.addEventListener("change", e => Promise.resolve().then(() => console.log("change microtask from document listener")));
  window.addEventListener("change", e => console.log(e.type + " from window listener", e.target.id));
  window.addEventListener("change", e => Promise.resolve().then(() => console.log("change microtask from window listener")));

  //test showing that at least one `input` event must be dispatched for the `change` event to occur.
  const input = document.querySelector("input[type='text'");
  const textarea = document.querySelector("textarea");
  input.focus();// move focus to the first text input
  input.value = "hello sunshine";
  textarea.focus();
</script>
```

## The purpose of `change`

Why do we need a `change` event? `change` events group many `input` events for text input elements. This is necessary because:
1. When a user writes text, he can often change his mind. And undo his changes. Most reactive functions only need to listen for events when the user has *finished writing* and *moves onto* the next field.
2. When a user updates a text input, keystrokes can occur faster than once per 16ms (ie. more than one `input` event per frame). If we ran a heavy event listener function for each of these `input` events, this would be very costly and likely to cause lag in the application. So, instead, multiple `input` events for text input elements are grouped as a single `change` event instead.

To avoid listening for *both* `change` events for text input elements and regular `input` events for all other input elements, the `input` event for non-text input elements are simply doubled as a `change` event.

## Technical details

The `change` event is **past-tense**. The `change` event only describes a state change that has already occurred/is completed. It is built for observation/reaction, not prevention. `change` is `cancelable: false` with a void `.preventDefault()` function.

The `change` event is **only** dispatched when:
1. A state change of the input element is announced by an `input` event. Thus, at least one `.isTrusted = true` user-driven event must occur for a `change` event to occur. The `change` event is **not** dispatched when the element's property value is *only* changed by **scripts**.
2. When the state of the input element has changed from the start to the end of a focus session. A focus session is the period that passes between the time the element gains focus until the element looses focus. For example, if a text input gains focus, "a" is added to the end of its `.value`, a "Backspace" removes that "a" character again, and then the text input looses focus, then no `change` event will be dispatched on the text input.
3. The 

The `input` event of `<select>` elements are dispatched **before the `mouseup`** event, while the `input` event for other `<input>` elements such as checkboxes and radiobuttons are dispatched **after the `click`** event. 

The `change` event is queued **sync** immediately before the `blur` event or an indirectly generated `click` event. It is as if the `change` event is a) added as a default action on the `input` event for `select, input:not([type='text'])` elements, and b) run sync as a pre-propagation callback on the `blur`/`focusout` or the implicitly generated `click` events.  
 
The `change` event runs a) *async* for text input elements and `<input>` elements, but b) *sync* for `<select>` elements. This means that any microtask queued for each event listener is run before the next event listener *most of the time*, but *not for `<select>` elements. Dispatching events to run async cannot easily be replicated in JS. 

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

To capture the change events for non-text input elements, we simply listen for `input` events and queue a `my-change` event to be dispatched *before* the next `click` or `mouseup` event (for `<select>` elements).

To capture the change events for text input elements, we must listen for `focusin`, events and then `input`, `blur`, and indirectly generated `click` events. The `blur` event is used instead of `focusout` as it will run *before* the `focusout` event. The `click` event is generated when the user submits a form by pressing "enter" while an `<input type="text">` element has focus. The `input` event is necessary to verify that at least one part of the change of the text input element state was user-driven. The `my-change` event is dispatched synchronously at during the EarlyBird event listener to simulate it being dispatched immediately before the end of the focus session.

```html
<script src="../../1b_EventLoop/demo/toggleTick.js"></script>
<script>
  (function () {

    class ChangeController {
      constructor() {
        this.target = undefined;
        this.startValue = undefined;
        this._onInputNormal = this.onInputNormal.bind(this);
        this._onFocusin = this.onFocusin.bind(this);//we need to listen for focusin, as the focusin is much more efficient than the focus event (there are often many focus events per focusin event)
        this._onBlur = this.onBlur.bind(this);//we need to listen for blur, as the focusout is propagates after blur
        this._onInputText = this.onInputText.bind(this);
        this._onClick = this.onClick.bind(this);
      }

      dispatchChange(target) {
        const changeEvent = new InputEvent("my-change", {composed: false, bubbles: true, cancelable: false});
        target.dispatchEvent(changeEvent);
      }

      initState() {
        window.addEventListener("focusin", this._onFocusin, true);
        window.addEventListener("input", this._onInputNormal, true);
      }

      removeInitState() {
        window.removeEventListener("focusin", this._onFocusin, true);
        window.removeEventListener("input", this._onInputNormal, true);
      }

      textState(el) {
        //It would be tempting to add event listeners to the el,
        //but this would have a bigger risk for the event listener to be hit by a capture torpedo.
        window.addEventListener("input", this._onInputText, true);
        window.addEventListener("click", this._onClick, true);
        window.addEventListener("blur", this._onBlur, true);
        this.target = el;
        this.startValue = el.value;
        this.textStateInput = false;
      }

      removeTextState() {
        window.removeEventListener("input", this._onInputText, true);
        window.removeEventListener("click", this._onClick, true);
        window.removeEventListener("blur", this._onBlur, true);
        this.target = undefined;
        this.startValue = undefined;
        this.textStateInput = undefined;
      }

      fromTextToInit() {
        if (this.textStateInput && this.startValue !== this.target.value)
          this.dispatchChange(this.target);
        this.removeTextState();
        this.initState();
      }

      onInputNormal(e) {
        const el = e.composedPath()[0];
        if (el instanceof HTMLElement && el.matches("select, input:not([type='text'])"))
          return toggleTick(() => this.dispatchChange(el), ["mouseup", "click"]);
      }

      onFocusin(e) {
        const rootTarget = e.composedPath()[0];
        if (!(rootTarget instanceof HTMLElement) || !rootTarget.matches("input[type='text'], textarea"))
          return;
        this.removeInitState();
        this.textState(rootTarget);
      }

      onInputText(e) {
        const rootTarget = e.composedPath()[0];
        if (this.target !== rootTarget)
          throw new Error("omg.. This wasn't supposed to happen.");
        this.textStateInput = true;
        window.removeEventListener("input", this._onInputText, true);
      }

      onBlur(e) {
        const rootTarget = e.composedPath()[0];
        if (this.target !== rootTarget)
          throw new Error("omg.. This wasn't supposed to happen.");
        this.fromTextToInit();
      }

      onClick(e) {
        const rootTarget = e.composedPath()[0];
        if (rootTarget === this.target)
          return;
        if (this.target.form !== rootTarget.form)
          throw new Error("omg.. This wasn't supposed to happen.");
        this.fromTextToInit();
      }
    }

    const changeController = new ChangeController();
    changeController.initState();
  })();
</script>

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
  <input type="submit" id="submit">
</form>

<script>
  window.addEventListener("submit", e => e.preventDefault());

  window.addEventListener("mousedown", e => console.log(e.type, e.target.id));
  window.addEventListener("mouseup", e => console.log(e.type, e.target.id));
  window.addEventListener("click", e => console.log(e.type, e.target.id));
  window.addEventListener("keypress", e => console.log(e.type, e.target.id));
  window.addEventListener("input", e => console.log(e.type, e.target.id));
  window.addEventListener("submit", e => console.log(e.type, e.target.id));
  document.addEventListener("focus", e => console.log(e.type, e.target.id), true);
  window.addEventListener("focusin", e => console.log(e.type, e.target.id));
  document.addEventListener("blur", e => console.log(e.type, e.target.id), true);
  window.addEventListener("focusout", e => console.log(e.type, e.target.id));

  //test showing change event runs ASYNC
  document.addEventListener("change", e => console.log(e.type + " from document listener", e.target.id));
  document.addEventListener("change", e => Promise.resolve().then(() => console.log("change microtask from document listener")));
  window.addEventListener("change", e => console.log(e.type + " from window listener", e.target.id));
  window.addEventListener("change", e => Promise.resolve().then(() => console.log("change microtask from window listener")));

  //test showing my-change event runs SYNC
  document.addEventListener("my-change", e => console.log(e.type + " from document listener", e.target.id));
  document.addEventListener("my-change", e => Promise.resolve().then(() => console.log("my-change microtask from document listener")));
  window.addEventListener("my-change", e => console.log(e.type + " from window listener", e.target.id));
  window.addEventListener("my-change", e => Promise.resolve().then(() => console.log("my-change microtask from window listener")));
</script>
```

## References

1. [MDN: change event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event);
2. [MDN: beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event)
 