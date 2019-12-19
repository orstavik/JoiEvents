# DefaultAction: Checkbox

The defaultAction of click on a checkbox is to flip the value of the checkbox: if the checkbox is empty when you click on it, it becomes checked; if it is checked, it becomes empty.

## Problem: Errors in the EventCascade of native `<input type="checkbox">`

There are some issues with the EventCascade related to native checkboxes:

1. If you call `.preventDefault()` on the `click` event that causes the `<input type="checkbox">` to change its value, you will cancel the change.
2. But! The task of *changing* the value of the `.checked` property and thus the visual expression of the checkbox in the DOM, is scheduled *before(!)* the `click` event is dispatched.
3. Thus, if you `click` on an empty checkbox and a script calls `.preventDefault()` on the `click` event, the browser will:
   1. perform a *first* task to change the state of the checkbox to `checked` *before* the click event is dispatched,
   2. show the checkbox as `checked` during the entire propagation cycle of the `click` event, including *after* the `click.preventDefault()` method has been called, and
   3. perform a *second* task that *reverts* the state of the checkbox that was performed in the first task.

![EventCascade for native checkbox preventDefault](sketches/native_checkbox_eventcascade.jpg)

## `change` means "has changed"

The `change` event is always executed *after* the state-altering task has been performed. This means that the `change` event should be read as **"has-changed" event**, NOT as a "will-change". You should NOT expect that calling `.preventDefault()` on the `change` event should stop/revert the state-change that has already happened. But why?

The reason is that the `click` event functions as the "will change" event. The `<input type="checkbox">` cannot have any children element, and therefore if you place a `click` event listener on the checkbox element, you can be sure that every time this event listener is triggered, it is the checkbox that has been clicked. Ie. you can be sure that this click signifies a "will change" of the checkbox.

If the `<input type="checkbox">` could contain child elements that
  
it is simple enough to add an eventListener for click on the input element, and call preventDefault from it. There is thus no need for a (before)change event.
If the input element could be a) parent element, whose b) children also could react to click events, then there would be more of a need to distinguish a before-change event for the checkbox, as a convenience to the user developers. But, as this is not the case, and a click hitting a checkbox can only mean one thing: a prelude to a checkbox change, we don't need the extra (before)change event.

   
## Demo: EventCascade problems with native `<input type="checkbox">`

```html 
<div>
  <input type="checkbox">
</div>

<script>
  const div = document.querySelector("div");
  const check = document.querySelector("input");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase, "checkbox is " + (check.checked ? "filled" : "empty"));
  }

  function preventD(e) {
    console.log("calling: " + e.type + ".preventDefault()");
    e.preventDefault();
  }

  div.addEventListener("mouseup", log, true);
  check.addEventListener("mouseup", log);
  div.addEventListener("mouseup", log);

  window.addEventListener("click", preventD, true);  //preventDefault() called first on the click event

  div.addEventListener("click", log, true);
  check.addEventListener("click", log);
  div.addEventListener("click", log);

  div.addEventListener("change", log, true);
  check.addEventListener("change", log);
  div.addEventListener("change", log);

</script>
```

## How *should* the EventCascade for checkboxes be?

The problem with the EventCascade for the defaultAction of altering a checkbox' value, is the cart-before-the-horse timing of:
 1. executing the task that alters the state and shadowDOM of the native `<input type="checkbox">` *before*
 2. the dispatch of the `click` event, whose `.preventDefault()` method should block/control the state-altering task.   

There are two ways to fix this:
1. move the state-altering task *after* the dispatch of the `click` event, and
2. move the control of the state-altering task *ahead in time* to the `preventDefault()` of the `mouseup` event.

The first alternative is better because:
1. the `click` is the "intuitive" place from where to control the state-altering task of the changing a checkbox' value. The `mouseup` is lower level, developers would not expect `preventDefault()` on `mouseup` to block anything.
2. To move the update of the state one position in the EventCascade (from immediately before the `click` event to immediately after) is a minimal alterations of existing structure.     
 
This would produce the following "corrected" EventCascade:

![EventCascade for "corrected" checkbox preventDefault](sketches/native_checkbox_eventcascade.jpg)
 For input checkbox, the correct order should be
Mouseup, click, alterShadowDom, (has)changed

```html 
<script>
  class CorrectedCheckbox extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<div style="border: 2px solid grey; width: 1em; height: 1em;"></div>`;

      this.checked = false;
      this.addEventListener("click", this.onClick.bind(this));
    }

    onClick(e) {
      if (e.defaultPrevented)
        return;
      e.preventDefault(); //cancel any other side-effect from click
      const taskId = setTimeout(this.doChangeAndDispatchHasChangedEvent.bind(this), 0);
      e.preventDefault = function () {
        clearTimeout(taskId);
      }
    }

    doChangeAndDispatchHasChangedEvent() {
      this.checked = !this.checked;
      this.shadowRoot.children[0].innerText = this.checked ? "v" : "";
      this.dispatchEvent(new CustomEvent("has-changed", {composed: true, bubbles: true}));
    }
  }

  customElements.define("corrected-checkbox", CorrectedCheckbox);
</script>


<div>
  <corrected-checkbox></corrected-checkbox>
</div>

<script>
  const div = document.querySelector("div");
  const check = document.querySelector("corrected-checkbox");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase, "checkbox is " + (check.checked ? "filled" : "empty"));
  }

  div.addEventListener("mouseup", log, true);
  check.addEventListener("mouseup", log);
  div.addEventListener("mouseup", log);

  div.addEventListener("click", log, true);
  check.addEventListener("click", log);
  div.addEventListener("click", log);

  div.addEventListener("has-changed", log, true);
  check.addEventListener("has-changed", log);
  div.addEventListener("has-changed", log);

  function preventD(e) {
    console.log("calling: click.preventDefault()");
    e.preventDefault();
  }
  /*
   * Call click.preventDefault() by uncommenting on of the lines below.
   * It makes no difference if you call .preventDefault() at
   * the beginning, middle or end of the event propagation cycle.
   */
  // window.addEventListener("click", preventD, true);    //the beginning of the capture phase of propagation
  // check.addEventListener("click", preventD);           //the target phase of propagation
  // window.addEventListener("click", preventD);          //the end of the bubble phase of propagation
</script>
```

## Conclusion??

## References:

 * 