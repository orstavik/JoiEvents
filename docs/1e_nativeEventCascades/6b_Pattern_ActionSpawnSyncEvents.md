# Pattern: ActionSpawnSyncEvents

Actions (ie. functions) either on elements in the DOM or in the browser often spawn events. Events such as `scroll`, `toggle`, `focus`, `beforeunload`, etc. etc. are all created as a reaction to a function in the browser. The purpose of these events is to provide a callback for other functions that would like to react to such DOM state changes or browser state changes.

Actions can spawn:
 * many events per action
 * many different event types per action
 * events on several different targets per action.
 
## Demo: How does `.focus()` work?

The focus events are an important group of elements that are driven by a function: `HTMLElement.focus()`. Focus is used to signal which `<input>` or `<textarea>` that will receive any `keypress` events.
 
There are four focus events:
1. `blur`. A non-bubbling, sync event that is dispatched on an element when it looses focus.
2. `focusout`. A *bubbling* clone of `blur`.
3. `focus`. A non-bubbling, sync event that is dispatched on an element that receives focus. 
4. `focusin`. A *bubbling* clone of `focus`.

And when the focus is shifted between two input elements, then the events will be dispatched in the order above.

The focus events are **sync**. This means that they are dispatched as part of the same JS frame, ie. that any microtask that are scheduled during their execution is run after their dispatch have completed. This is true not only of each event, but also for all four events if they are triggered to be dispatched by the same change of focus.  

```html
<input id="one" type="text" value="Hello sunshine!"/>
<input id="two" type="text" value="Hello world."/>

<script>
  (function () {
    const one = document.querySelector("#one");
    const two = document.querySelector("#two");

    function log(e) {
      console.log("-- " + e.target.id + "." + e.type + " --");
      console.log("document.activeElement: " + (document.activeElement.id || document.activeElement.tagName));
      Promise.resolve().then(()=>{
        console.log("microtask from " + e.target.id + "." + e.type);});
    }

    one.addEventListener("focus", log);
    one.addEventListener("focusin", log);
    one.addEventListener("focusout", log);
    one.addEventListener("blur", log);

    two.addEventListener("focus", log);
    two.addEventListener("focusin", log);
    two.addEventListener("focusout", log);
    two.addEventListener("blur", log);

    one.focus();
    console.log("##########");
    two.focus();
    console.log("##########");
  })();
</script>
```

Result: 

```
-- one.focus --
document.activeElement: one
-- one.focusin --
document.activeElement: one
##########
-- one.blur --
document.activeElement: BODY
-- one.focusout --
document.activeElement: BODY
-- two.focus --
document.activeElement: two
-- two.focusin --
document.activeElement: two
##########
microtask from one.focus
microtask from one.focusin
microtask from one.blur
microtask from one.focusout
microtask from two.focus
microtask from two.focusin
```

There are a few nuances that are good to highlight:
1. When the `blur` and `focusout` event are dispatched, the new `document.activeElement` is not yet selected. Instead, the browser defaults to simply the `document.body`.
2. As we can see from the queueing of the microtasks, all the four focus events are dispatched synchronously. Microtasks are NOT run immediately after neither a) individual event listeners, nor b) the complete event propagation. We see this as the microtasks from `one.focus()` are run after the `two.focus()` has completed. 

## Demo: `HTMLElement.myFocus()` 

In this demo we will replicate the functionality of `HTMLElement.focus()` in a monkeypatch `HTMLElement.myFocus()` method. Here, we can see exactly what the browser does, in plain JS.

```html
<input id="one" type="text" value="Hello sunshine!"/>
<input id="two" type="text" value="I don't want focus."/>

<script>
  (function () {

    HTMLElement.prototype.myFocus = function () {
      const oldMyActive = document.myActiveElement;
      document.myActiveElement = document.body;
      if (oldMyActive) {
        oldMyActive.dispatchEvent(new FocusEvent("my-blur", {composed: true, bubbles: false}));
        oldMyActive.dispatchEvent(new FocusEvent("my-focusout", {composed: true, bubbles: true}));
      }
      document.myActiveElement = this;
      this.dispatchEvent(new FocusEvent("my-focus", {composed: true, bubbles: false}));
      this.dispatchEvent(new FocusEvent("my-focusin", {composed: true, bubbles: true}));
    };

    const one = document.querySelector("#one");
    const two = document.querySelector("#two");

    function log(e) {
      console.log("-- " + e.target.id + "." + e.type + " --");
      console.log("document.myActiveElement: " + (document.myActiveElement && document.myActiveElement.id));
      Promise.resolve().then(()=>{
        console.log("microtask from " + e.target.id + "." + e.type);});
    }

    one.addEventListener("my-focus", log);
    one.addEventListener("my-focusin", log);
    one.addEventListener("my-focusout", log);
    one.addEventListener("my-blur", log);

    two.addEventListener("my-focus", log);
    two.addEventListener("my-focusin", log);
    two.addEventListener("my-focusout", log);
    two.addEventListener("my-blur", log);

    //focus can be controlled via script
    one.myFocus();
    console.log("##########");
    two.myFocus();
    console.log("##########");
  })();
</script>
``` 

## References

 * dunno