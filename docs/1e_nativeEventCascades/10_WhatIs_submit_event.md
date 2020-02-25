# WhatIs: `submit`?

> I didn't say it would be easy. I just promised to tell the truth. But this is actually easy.

The `submit` event is fired *before* a `<form>` is submitted and the browser navigates to a new document. The `submit` event is usually intercepted to check (validate) the form before it is submitted or to prevent it from being sent.

There are 4 ways to submit a form and send it to the server:

1. The user `click` on a submit button, ie. a `<input type="submit">`, `<input type="image">` or `<button type="submit"> Submit </button>` element.
2. The user `keypress` "enter" while the document's focus is on an `<input>` element in the form. If a submit button is present, the "enter" keypress will trigger a `click` event on the first submit button in the DOM tree order; if no submit button is present, the "enter" will just submit the form without any `click` event.
    * Caveat: if there is a) no submit button in the form AND b) more than one `<input>` element in the form, then `keypress` "enter" will *not* submit the form.
3. A script calls `.submit()` on a `<form>` element.
4. A script calls `.requestSubmit()` on a `<form>` element.

*One* of these methods, calling `.submit()` from a script, does *not* trigger a `submit` event. The three other methods will all dispatch a `submit` event *before* the form is submitted. The difference between `submit()` and `requestSubmit()` will be described in more detail later.

The `submit` event is `cancelable`. This means that calling `.preventDefault()` will stop the form from being submitted to the server and the browser from navigating out of the document.
  
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

In the demo below a function `SubmitController` essentially recreates the logic of the `submit` event cascade and defines its own `my-submit` event. 
 
The demo:

1. Adds a function `toggleTick` that allows to delay event dispatching;
2. Completely blocks all the native `'submit'` events. 
3. Then it adds a function `SubmitController` that listens for `beforeinput`,`click` events and intercepts `requestSubmit()` calling;
4. Once the `ResetController` receives an appropriate trigger event, it:
    1. When the `"beforeinput"` event is activated, the `Enter` button is filtered out.  
        1. After it is pressed, the default action is blocked. This is necessary to avoid `click()`  on the submit button, which is initialized by the browser;
        2. The specification defines the features of activating the event by pressing a key. If the number of `<input>` elements differs, the behavior will be different. So it is necessary to determine their number and then depending on the result of the event and do the default actions;
        3. Delay the sending of the event to make it possible to cancel it.
    2. If the `click` event is activated, the value of `type` attribute of event target will be checked. This is necessary in order to ensure the activation of the functionality only by means of the `submit` buttons.
    3. If 'requestSubmit()` is reconciled, it will be intercepted and processed. 
        1. In accordance with the [spec](https://html.spec.whatwg.org/multipage/forms.html#dom-form-requestsubmit), it is checked for errors;
        2. In addition, depending on the value of the passed argument, the [`submitter`](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-submitevent-interface) property is added to the event.
5. Demo presents two forms. The first simulates the activation of `submit` event. 
   The second one demonstrates the prevention of activation with `e.preventDefault()` placed inside event listener of the custom `my-submit` event.         
    
 ```html
    <form id="one">
        <fieldset>
            <legend>Click "Submit" button or press Enter</legend>
            <input type="text" value="Hello" name="story">
            <input type="text" value="Sunshine" name="story">
            <input id="a" type="submit">
            <div id="b"> requestSubmit(button)</div>
            <div  id="c"> requestSubmit()</div>
        </fieldset>
    </form>
    
    <form id="two">
        <fieldset>
            <legend>Click the "Submit" button, but it will be prevent</legend>
            <input type="text" value="Name" name="story">
            <input type="text" value="Surname" name="story">
            <input id="a1" type="submit">
            <div  id="b1"> requestSubmit(button)</div>
            <div  id="c1"> requestSubmit()</div>
        </fieldset>
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
    
        const SubmitController = {
    
          beforeinput: function (e) {
            let formElement = e.target.form;
            // we can use only Enter key
            if (e.inputType !== "insertLineBreak" || !formElement)
              return;
            // to prevent default click() after Enter key press
            e.preventDefault();
            // check how many input elements (not reset/submit type) are located in the form
            let inputs = formElement.querySelectorAll("input:not([type=reset]):not([type=submit])").length;
            // select first submit button (default button according to spec)
            let firstSubmitButton = formElement.querySelector("input[type=submit]");

            let submitEvent = new InputEvent("my-submit", {composed: true, bubbles: true, cancelable: true});
    
            // According to spec(https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)
            // 1. if one or several <input>s and one or several submit buttons are located on the <form> - .click() on default button to submit a form
            if (inputs >= 1 && firstSubmitButton)
              firstSubmitButton.click();
            //2. if there is only one <input> element  - fire 'submit' event on <form> (even if there is no any submit button)
            else if (inputs === 1) {
              // delay event to make it possible to prevent it
              toggleTick(() => {
                formElement.dispatchEvent(submitEvent);
                if (submitEvent.defaultPrevented) {
                  clearTimeout(i);
                  console.log("defaultPrevented ");
                }
              });
              //fires after toggleClick to provide default action prevention
              let i = setTimeout(() => {
                console.log("do default action here");
              }, 0);
            }
          },
    
          click: function (e) {
            let formElement = e.target.form;
            if (e.target.type && e.target.type !== "submit" || !formElement)
              return;
    
            let submitEvent = new InputEvent("my-submit", {composed: true, bubbles: true, cancelable: true});
    
            toggleTick(() => {
              formElement.dispatchEvent(submitEvent);
              if (submitEvent.defaultPrevented) {
                clearTimeout(i);
                console.log("defaultPrevented ");
              }
            });
    
            let i = setTimeout(() => {
              console.log("do default action here");
            }, 0);
          },
    
          requestSubmit: function (submitButton) {
           
            //Set errors according to  https://html.spec.whatwg.org/multipage/forms.html#dom-form-requestsubmit
            if (submitButton && submitButton.type !== "submit")
               throw new Error("TypeError: " + submitButton.type + "type is not submit");
            if (submitButton && submitButton.form !== this)
              throw new Error("NotFoundError: " + this.tagName + " not a FORM");
            
            let submitEvent = new InputEvent("my-submit", {composed: true, bubbles: true, cancelable: true});

            if (submitButton !== null)
              submitEvent.submitter = submitButton;
    
            toggleTick(() => {
              this.dispatchEvent(submitEvent);
              if (submitEvent.defaultPrevented) {
                clearTimeout(i);
                console.log("defaultPrevented ");
              }
            });
    
            let i = setTimeout(() => {
              console.log("do default action here");
            }, 0);
          }
        };
    
        window.addEventListener("submit", e => e.preventDefault());
        window.addEventListener("beforeinput", SubmitController.beforeinput.bind(this), true);
        window.addEventListener("click", SubmitController.click, true);
        HTMLFormElement.prototype.requestSubmit = function (submitter) {
          SubmitController.requestSubmit.call(this, submitter)
        };
    
      })();
      
      let one = document.querySelector("#one");
      let two = document.querySelector("#two");
      let button = document.querySelector("#a");
      let button1 = document.querySelector("#a1");
    
      //form 1, must log "do default action here"
      document.querySelector("#b").addEventListener("click", () => one.requestSubmit(button));
      document.querySelector("#c").addEventListener("click", () => one.requestSubmit());
    
      //form 2 preventable, must log "defaultPrevented"
      document.querySelector("#b1").addEventListener("click", () => two.requestSubmit(button1));
      document.querySelector("#c1").addEventListener("click", () => two.requestSubmit());
    
      one.addEventListener("my-submit", e => console.warn(e.type));
      two.addEventListener("my-submit", e => console.warn(e.type));
      two.addEventListener("my-submit", e => e.preventDefault());
    
      window.addEventListener("click", e => console.log(e.type, " on ", e.target.id))
    
    </script>
 ```

Some events such as `submit` only have *one* possible default action. They are simple. Likeable. And we say that these events-to-defaultAction pairs conform to a OneEventToOneAction pattern.

So. What does these events look like inside? How can we make such events in JS? And what does the function that control them look like?

## References

 * [MDN: `submit` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event);
 * [MDN: `.submit()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit);
 * [MDN: `.requestSubmit()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit);
 * [`submitter` event property](https://www.chromestatus.com/feature/5187248926490624)