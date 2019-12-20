# DefaultAction: Checkbox

The defaultAction of `click` on an `<input type="checkbox">` (hereafter: checkbox) is to flip the value of the checkbox: if the checkbox is empty when you click on it, it becomes checked; if it is checked, it becomes empty.

## Anti-pattern: `.preventDefault()` as "ctrl+z"

There is a big issue with the EventCascade and use of `.preventDefault()` of native checkboxes.

Imagine the following situation:
1. The user `click`s on a checkbox.
2. This action will change the value of the checkbox (if not prevented).
3. But, a script needs to prevent this change in some circumstances. The script therefore adds an event listener on the checkbox for `click` events, and then calls `.preventDefault()` on this `click` event.
 * This idea is fine. You can `click` on a checkbox to change its value. If you need to prevent this change, you simply call `.preventDefault()` on the `click` event. 

But. There is a problem: **the browser changes the value of the checkbox *before* the `click` event is dispatched**. The checkbox you see on screen and the value of its `.checked` property you read from JS has *already changed* when the `click` event is dispatched.

![EventCascade for native checkbox preventDefault](sketches/native_checkbox_eventcascade.jpg)

To get the `click.preventDefault()` to produce the expected result, the `click.preventDefault()` method cannot simply *cancel* a queued action not yet done. Instead, `click.preventDefault()` must when applied to a checkbox *add* a *second* task that will *undo the changes of the checkbox that has already been implemented*. Ie. `click.preventDefault()` adds an "additional ctrl+z task" when checkboxes are clicked. 

Furthermore, the state of a checkbox should be considered unsafe during *any* `click` event listener that might be triggered when a checkbox is clicked:
1. As `.preventDefault()` might be called at any time during a `click` event propagation,  the state of the checkbox after the `click` event might not be known. Fortunately, this is a solved problem. The `change` event is dispatched *after* the `click` event has propagated (ie. when `.preventDefault()` is not called). The `change` event thus gives the developer easy access to situations when checkbox values "has-changed".
2. To read the state of the checkbox *before* the EventCascade began, a `click` event listener on a parent element above a checkbox *must* first a) check to see if the checkbox is the target element of the `click` event, and then b) use the inverse value of the `checked` property as the *before* value for the checkbox. Not pretty.

## Demo: CheckboxCtrlZ

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

The CheckboxCtrlZ problem is caused by a simple error of sequence in the EventCascade:
 1. the task that alters the state and shadowDOM of the checkbox is executed *before*
 2. the `click` event propagation, while the `click.preventDefault()` method is the designated controller of the state-altering task.   

There are two ways to fix this:
1. move the state-altering task *after* the dispatch of the `click` event, or
2. move the control of the state-altering task to the `.preventDefault()` of an *earlier* event, such as `mouseup`.

Alternative 1 is better. In most other situations, the browser changes state *after* the `click` event has propagated. For example, the browser doesn't navigate to a new page *before*  the `click` on a link has propagated. Moving the state-altering task for checkboxes post `click` propagation thus would fit with other EventCascades that involve `click`. Furthermore, `click.preventDefault()` is an intuitive control for checkbox `click`s. It is the `click` action that alters the checkbox, not a `mouseup` for example.
 
A "corrected" EventCascade for checkbox `click`s would therefore be:

    mouseup => click => "state-change" => change

where calling `click.preventDefault()` would essentially cancel the two ensuing tasks: the "state-change" task and the `change` event propagation task. 

![EventCascade for "corrected" checkbox preventDefault](sketches/native_checkbox_eventcascade.jpg)

## Demo: CheckboxChangeCorrected

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

## Why `change` is "after-change" for checkboxes?

The `change` event is always executed *after* a) the state-altering task has been performed and b) can no longer be prevented. This means that the `change` event should be read as "has-changed" event, NOT as a "will-change". Furthermore, as the state change "has-changed", you should NOT expect `change.preventDefault()` to be able to prevent state change neither. But why? Why make `change` a "has-changed" event and not a "will-change" event?

The reason is that the `click` event is the "will-change" event for checkboxes. Checkboxes cannot have any children element. Therefore, if a `click` event propagates to/through a checkbox, then it is a 100% certain that it was the checkbox that was `click`ed. So, if you listen for `click` events on a checkbox, you can be sure that this event listener and this `click` event is a "will-change" reaction.

However, if checkboxes could contain child elements that also reacted to `click`s, the situation would be different. In such a scenario, adding a `click` event listener on a checkbox would not be enough to exclusively identify "will-change" events for the checkboxes, but the event listener would also be required to verify that the target of the `click` was the checkbox itself or one of its "unclickable children", and not one of its "clickable children". Such boilerplate checks for (is this my `click` or a `click` meant for one of my children?) are both a) easy to get wrong, b) forget, and c) universal, and therefore in such instances it is better that the platform adds another "beforechange" type of event that will propagate *after* the `click` and *before* the state-change is done.

So, for elements that cannot have interactive child elements, adding event listeners directly to the element is enough to distinguish between different exclusive use-cases. Events on such elements can cope with a much simpler EventCascade (ie. `click` => stateChange => `change` suffices). But. For elements that can house interactive child elements, the a more detailed EventCascade is helpful as it avoids misunderstanding and event listener boilerplate (ie. `click` => `before-change` => stateChange => `after-change` is preferable).

## References:

 * 