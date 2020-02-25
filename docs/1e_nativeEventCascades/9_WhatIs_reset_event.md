# WhatIs: `reset`?

The `reset` event make it possible to reset the form to its default values without reloading the page. There are two ways to trigger the `reset` event:
1. `click` on a reset button: `<input type="reset" value="Reset">` or `<button type="reset">Reset</button>`;
2. call `.reset()` on `<form>` element from a script.
  
To reset is simply to use the original value to overwrite/update the current value. But, what is the **original value**? And what is the **current value**?

The **original value** of: 
* a `<select>` element is the `value` attribute of the first `<option>` element with a `selected="selected"` attribute, such as `"b"` in `<option value="b" selected="selected">`.   
* a `<textarea>` element is its text child node.   
* a `<input type="checkbox">` element is its `checked` attribute.   
* a `<input type="text">` element is its `value` attribute.

The **current value** of all the input elements above is the JS property `.value`.

> Att! The `.value` property of input elements DO NOT reflect/mirror the `value` attribute of the same element. The two are completely DiFfErEnT things.

> Att! As the  `<textarea>` element, the `<output>` element will revert to its `.innerText` value when its parent `<form>` is `reset`. But. This is really not what you would want; you would want the `<output>` element to update its calculation when being `reset`. However, this element is so little used, that we do not spend your time talking about its shortcomings. :)

## The flow of the `reset` event

The `reset` event fires immediately **before** input elements in a `<form>` is reset.

The `reset` event is `cancelable`. By calling `.preventDefault()` on the `reset` event you prevent a `<form>` from resetting its values.

The `reset` event is also preventable from `click`. If you call `.preventDefault()` on the `click` event, then the `reset` event will not be dispatched.

## Demo: `reset` form

```html
<form oninput="c.value=parseInt(a.value)+parseInt(b.value);">
  <input type="text" size="50" value="In the beginning..."/>
  <textarea>...there was a textnode...</textarea>
  <select id="normalSelect">
    <option value="a">a</option>
    <option value="b" selected="selected">b</option>
    <option value="c">c</option>
  </select>
  <input id="normalCheckbox" type="checkbox" checked>
  <hr>
  0<input type="range" id="a" value="50">100 +
  <input type="number" id="b" value="50"> =
  <output id="c" for="a b"></output>
  <hr>
  <input type="reset" value="Reset">
  <button type="reset">Reset</button>
  <button id ="clickPrevented" type="reset">Reset, but with click.preventDefault() being called.</button>
  <div id="test">.reset()</div>
</form>

<script>
  document.querySelector("#test").addEventListener("click", e => e.target.parentNode.reset());
  document.querySelector("#clickPrevented").addEventListener("click", e => e.preventDefault());

  window.addEventListener("click", e=> console.log(e.target.tagName));
  window.addEventListener("reset", e=> console.log(e));
  // window.addEventListener("reset", e=> e.preventDefault());  //enable this to block the form from resetting itself
</script>
```        

* To see the **current** value of the different elements, open dev tools and check each element objects `.value` property. You will quickly see that the JS `.value` element is different from for example the same elements `value` attribute. This is not really nice. The `value` attribute should have been given a different name, such as `original-value`, to avoid confusion.

### Demo: `ResetController`

The `ResetController` first exposes the inside of the `HTMLFormElement.reset()` method. It splits this method into two steps: `HTMLFormElement.reset()` and `HTMLFormElement.resetAction()`. These two functions are only intended to illustrate what goes on inside the native code of the HTMLFormElement. They do not really change anything. However, the implementation is a little naive (it does not handle all the different element types in such as `<output>`), and it also renames the `reset` event to `my-reset` to make sure there is no overlap with native functionality in the results you see in the demo.

The `ResetController` is very simple. It only needs to filter out the appropriate `click` events of reset buttons, and then queue a call to `.reset()` the parent form element for the reset buttons. 

```html
<form>
  <input type="text" size="50" value="In the beginning..."/>
  <textarea>...there was a textnode...</textarea>
  <select id="normalSelect">
    <option value="a">a</option>
    <option value="b" selected="selected">b</option>
    <option value="c">c</option>
  </select>
  <input id="normalCheckbox" type="checkbox" checked>
  <hr>
  <input type="reset" value="Reset">
  <button type="reset">Reset</button>
  <div id="test">.reset()</div>
</form>

<script>
  (function () {
    //block native reset behavior
    window.addEventListener("click", e => {
      if (e.target.form && e.target.type === "reset" && (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON"))
        e.preventDefault();
    });

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

    function getOriginalSelectIndex(select) {
      const options = select.querySelectorAll("option");
      for (let i = 0; i < options.length; i++) {
        if (options[i].hasAttribute("selected"))
          return i;
      }
      return 0;
    }

    HTMLFormElement.prototype.resetAction = function () {
      for (let element of this.elements) {
        if (element.type !== "reset" && element.type !== "submit")
          element.value = element.getAttribute("value") || element.defaultValue;
        else if (element.tagName === "SELECT")
          element.selectedIndex = getOriginalSelectIndex(element);
        else if (element.tagName === "TEXTAREA")
          element.value = element.innerText;
      }
    };

    HTMLFormElement.prototype.reset = function () {
      const resetEvent = new InputEvent("my-reset", {cancelable: true, composed: true, bubbles: true});
      this.dispatchEvent(resetEvent);
      if (!resetEvent.defaultPrevented)
        this.resetAction();
    };

    const ResetController = {
      click: function (e) {
        const formElement = e.target.form;
        if (!formElement || e.target.type !== "reset" || (e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON"))
          return;
        toggleTick(e => !e.defaultPrevented && formElement.reset());
        //note, the .reset() function is called on the <form> element, not the target which is the <button type="reset"> element.
      },
    };

    window.addEventListener("click", ResetController.click);
  })();

  document.querySelector("#test").addEventListener("click", e => e.target.parentNode.reset());

  window.addEventListener("click", e => console.log(e), true);
  window.addEventListener("reset", e => console.log(e), true);
  window.addEventListener("my-reset", e => console.log(e), true);
  // window.addEventListener("my-reset", e=> e.preventDefault());  //enable this to block the form from resetting itself
</script>
```

### References 
1. [MDN: reset event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset_event);
2. [Spec: Resetting a form](https://www.w3.org/TR/html51/sec-forms.html#resetting-a-form).