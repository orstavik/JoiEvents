# WhatIs: `submit`?

> I didn't say it would be easy. I just promised to tell the truth. But this is actually easy.

The `submit` event is fired *before* a `<form>` is submitted and the browser navigates to a new document. The `submit` event is usually intercepted to check (validate) the form before it is submitted or to prevent it from being sent.

There are 4 ways to submit a form and send it to the server:

1. The user `click` on a submit button, ie. a `<input type="submit">`, `<input type="image">` or `<button type="submit"> Submit </button>` element.
   * Att! The action of requsting a `submit` event is preventable. This means that if you call `clickEvent.preventDefault()`, then the browser will stop pursuing any form validation, `submit` events, and form submission.
2. The user `keypress` "enter" while the document's focus is on an `<input>` element in the form. If a submit button is present, the "enter" keypress will trigger a `click` event on the first submit button in the DOM tree order; if no submit button is present, the "enter" will just submit the form without any `click` event.
    * Caveat: if there is a) no submit button in the form AND b) more than one `<input>` element in the form, then `keypress` "enter" will *not* submit the form.
3. A script calls `.submit()` on a `<form>` element.
4. A script calls `.requestSubmit()` on a `<form>` element.

*One* of these methods, calling `.submit()` from a script, does *not* trigger a `submit` event. The three other methods will all dispatch a `submit` event *before* the form is submitted. The difference between `submit()` and `requestSubmit()` will be described in more detail later.

The `submit` event is `cancelable`. This means that calling `.preventDefault()` on it will stop the form from being submitted to the server and the browser from navigating out of the document.
  
## Demo: Four ways to `submit` 

The `submit` event is dispatched *before* the form is submitted. But how is it queued? 

1. Is it dispatched immediately after the `click` event, or can other queued actions from the `click` event come before it?
    * The answer is immediately. If you queue another event loop task from for example a click event listener of a submit button, this event loop task will only run if the submit action is blocked from reloading the document, ie. a script having called `.preventDefault()` on the `submit` event. 
2. When triggered from script via the `requestSubmit()` method, will it run immediately, as the next microtask, or as the next event loop task?
    * The answer is *immediately*, even *before* the next queued microtask. The `requestSubmit()` method triggers the dispatch of the `submit` event immediately, sync. It is *not* delayed at all.

```html
<form>
  <input type="text" value="Click enter while I am in focus to submit.">
  <hr>
  <input type="submit">
  <input type="image" src="https://via.placeholder.com/150" width="50">
  <button type="submit">Submit</button>
  <button id="preventedSubmit" type="submit">Submit, but with click.preventDefault()</button>

  <div id="one">submit()</div>
  <div id="two">requestSubmit() (only works in new Chrome and Firefox).</div>
</form>

<script>
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

  document.querySelector("#preventedSubmit").addEventListener("click", e => e.preventDefault());

  document.querySelector("#one").addEventListener("click", e => e.target.parentNode.submit());
  document.querySelector("#two").addEventListener("click", e => {
    Promise.resolve().then(() => console.log("micro task queued BEFORE a .requestSubmit()"));
    e.target.parentNode.requestSubmit();
  });

  window.addEventListener("DOMContentLoaded", e => console.log("document (re)loaded"), true);
  window.addEventListener("submit", e => console.log("submit event"), true);
  window.addEventListener("submit", e => e.preventDefault(), true);

  window.addEventListener("click", e => {
    console.log("click");
    toggleTick(() => console.log("event loop task queued from click event"));
  }, true);
</script>
```

## Demo: `submit` script only

The demo below shows a form that can only be submitted via script. 

```html
<form>
  <input type="text" value="enter will not submit me">
  <input type="text" value="me neither">
  <input type="text" value="you can only submit this form via script">
</form>
```                                                                

## `requestSubmit()` vs. `submit()`

1. `.submit()` does *not* trigger a `submit` event while `requestSubmit()` do.
2. If form data is invalid, the form will still be sent using `submit()`, while `requestSubmit()` will not allow the form to be submitted while input data is invalid. 
   * Example: if an `<input type="number">` is filled with an erroneous number, such as only the letter `e` or `0.0.42`, then calling `requestSubmit()` will first trigger a validation of the form data, which will find an error in the `<input type="number">` entry, alert the user about this error, and *block* the form from being submitted. `submit()` would not care about the erroneous number input and just send the form with the data it contains.
        
```html
<form>
  <input type="number" size="300" placeholder="write 'e' or an erroneous number such as '0.0.3' here and submit"/>
  <input type="submit">
  <div id="one">submit()</div>
  <div id="two">requestSubmit()</div>
 </form>
 
 <script>
   document.querySelector("#one").addEventListener("click", e => e.target.parentNode.submit());
   document.querySelector("#two").addEventListener("click", e => e.target.parentNode.requestSubmit());
 
   window.addEventListener("submit", e => {
     e.preventDefault();
     console.log("submit event has been initiated by: #", e.target.id); 
   });
 </script>
   ```

## Demo: `SubmitController`

In the demo below, the two methods `HTMLFormElement.submit()` and `HTMLFormElement.requestSubmit()` are monkey-patched to illustrate their functionality. The good-old `submit()` method does neither validate nor dispatch any `submit` events. The newer `requestSubmit()` on the other hand does both validation and dispatch `submit` events as the user driven form submitting methods do.

In the `SubmitController` we can therefore rely on the `requestSubmit()` method when implementing the `submit` event controller. This simplifies the logic of the `SubmitController`.   
 
The demo:
1. Uses `toggleTick` to queue the task of requesting submits in the event loop. ;
2. Blocks the native `submit` event controller by calling preventDefault() on both click and enter keypress/beforeinput events in the relevant use cases. 
3. The `SubmitController` listens for `beforeinput` and `click` events, and when appropriate queue a call to `requestSubmit()` in the event loop (with the appropriate submit button element set as the event's [`submitter`](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-submitevent-interface)).
4. The `requestSubmit()` then:
   1. validates the form [spec](https://html.spec.whatwg.org/multipage/forms.html#dom-form-requestsubmit),
   2. dispatches the `submit` event synchronously, and 
   3. calls the good-old `submit()` method.
5. The good-old `submit()` method sends the form data to the server.

About processing `beforeinput` and `click` events:
* When the `SubmitController` processes the enter key and the submit button clicks, it must validate the click or the enter keypress to ensure that they are proper requests to submit the form. There are several click and enter keypresses that would not fulfill the criteria of form submission.
* The specification defines the features of activating the event by pressing an enter key. Depending on both the number of `<input>` elements and the presence of a submit button, the behavior of this algorithm differs.
* Only `click` on submit buttons will submit the form. 

 ```html
<form id="one">
  <input type="text" value="Hello" name="story">
  <input type="text" value="Sunshine" name="story">
  <input id="a" type="submit">
  <div id="b">requestSubmit(button)</div>
  <div id="c">requestSubmit()</div>
</form>

<script>
  (function () {
    HTMLFormElement.prototype.submit = function () {
      //1. we assume the form is valid
      //2. we do not dispatch submit event
      //3. we only submit the form
      console.log("Make the post https request and navigate to that page.");
    };

    HTMLFormElement.prototype.requestSubmitImpl = function (submitter) {
      //1. validate the form
      console.log("Validating the form.");

      //2. dispatch the submit event
      if (submitter) {
        //Set errors according to  https://html.spec.whatwg.org/multipage/forms.html#dom-form-requestsubmit
        if (submitter.type !== "submit")
          throw new Error("TypeError: " + submitter.type + "type is not submit");
        if (submitter.form !== this)
          throw new Error("NotFoundError: " + this.tagName + " not a FORM");
      }
      let submitEvent = new InputEvent("my-submit", {composed: true, bubbles: true, cancelable: true});
      submitEvent.submitter = submitter || this;
      this.dispatchEvent(submitEvent);
      //3. submit the form
      if (!submitEvent.defaultPrevented)
        this.submit();
    };

    HTMLFormElement.prototype.requestSubmit = function () {
      const submitter = this.querySelector("input[type='submit'], button[type='submit']");
      this.requestSubmitImpl(submitter);
    };

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

    // to prevent default submit event from keypress Enter events
    // (we use the beforeinput instead of the keypress to intercept enter).
    window.addEventListener('beforeinput', e => {
      if (e.inputType === "insertLineBreak" && e.target.form)
        e.preventDefault();
    });
    // to prevent default submit event from click on submit buttons
    window.addEventListener('click', e => {
      if (e.target.type === "submit" && (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON"))
        e.preventDefault();
    });

    const SubmitController = {

      beforeinput: function (e) {
        const formElement = e.target.form;
        // we can use only Enter key
        if (e.inputType !== "insertLineBreak" || !formElement)
          return;
        // select first submit button (default button according to spec)
        const firstSubmitButton = formElement.querySelector("input[type=submit], button[type=submit]");
        // check how many input elements (not reset/submit type) are located in the form
        const numberOfInputs = formElement.querySelectorAll("input:not([type=reset]):not([type=submit])").length;

        // According to spec(https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)
        // 1. if one or several <input>s and one or several submit buttons are located on the <form> - .click() on default button to submit a form
        if (numberOfInputs >= 1 && firstSubmitButton)
          firstSubmitButton.click();
        //2. if there is only one <input> element  - fire 'submit' event on <form> (even if there is no any submit button)
        else if (numberOfInputs === 1)
          toggleTick(() => formElement.requestSubmit());
      },

      click: function (e) {
        if ((e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") && e.target.type === "submit")
          toggleTick(() => e.target.form.requestSubmitImpl(e.target));
      }
    };
    window.addEventListener("beforeinput", SubmitController.beforeinput, true);
    window.addEventListener("click", SubmitController.click, true);
  })();

  const one = document.querySelector("#one");
  const button = document.querySelector("#a");
  const requestSubmitButton = document.querySelector("#b");
  const submitButton = document.querySelector("#c");

  window.addEventListener("my-submit", () => console.log("my-submit"));
  requestSubmitButton.addEventListener("click", e => e.target.parentNode.requestSubmit());
  submitButton.addEventListener("click", e => e.target.parentNode.submit());

  window.addEventListener("click", e => console.log(e.type, " on ", e.target.id))
</script>
 ```

## References

 * [MDN: `submit` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event);
 * [MDN: `.submit()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit);
 * [MDN: `.requestSubmit()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit);
 * [`submitter` event property](https://www.chromestatus.com/feature/5187248926490624)