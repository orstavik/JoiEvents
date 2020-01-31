# Pattern: ManyEventsToOneAction

In the previous chapter we saw how one action could trigger many different events on different targets. In this chapter we will look at how many different events can trigger the same action.

## Demo: `mousedown` and `keydown` do `.focus()`?

There are two events that trigger `.focus()`:
* `mousedown`
* `keydown`

> `touchstart` does not trigger `.focus()` directly. `touchstart` triggers `mousedown` which triggers `.focus()`.

```html
<input id="one" type="text" value="Hello sunshine!"/>
<input id="two" type="text" value="I don't want focus."/>

<script>
  document.addEventListener("DOMContentLoaded", function () {

    function log(e) {
      console.log(e.target.id + "." + e.type);
      setTimeout(function () {
        console.log(document.activeElement.tagName + "." + document.activeElement.id);
      });
    }

    window.addEventListener("mousedown", log);
    window.addEventListener("keydown", log);

    //.preventDefault() will block call to .focus() on both events
    // window.addEventListener("mousedown", e => e.preventDefault()); 
    // window.addEventListener("keydown", e => e.preventDefault());

    //mousedown or keydown events dispatched from script will not trigger .focus()
    // one.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
    // window.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Tab", code: "Tab", /*...*/ keyCode: 9}));
  });
</script>
```
 
 * To verify that focus has changed, we will check the `document.activeElement` from a `setTimeout()` after each trigger event. 
 * If we call `.preventDefault()` on `mousedown` or `keypress`, this will prevent the browser from calling `HTMLElement.focus()`. 
 * Only user generated events (.isTrusted) can change `.focus()`. Thus, calling `one.dispatch(new MouseEvent("mousedown"))` will not cause the focus to change.

## Demo 2: FocusController 

```html
<input id="one" type="text" value="Hello sunshine!"/>
<input id="two" type="text" value="I don't want focus."/>

<script>
  (function () {

    //1. turning off native call to .focus() for both native events
    window.addEventListener("mousedown", e => e.preventDefault(), true);
    window.addEventListener("keydown", e => e.preventDefault(), true);

    const FocusController = {
      onMousedown: function (e) {
        if (!e.isTrusted /*|| e.defaultPrevented*/)   //the check for preventDefault() is turned off in this test, see 1
          return;
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA")
          return;
        const task = setTimeout(function () {
          e.target.focus();
        });
      },
      tabIndex: -1,
      onKeydown: function (e) {
        if (!e.isTrusted /*|| e.defaultPrevented*/)   //the check for preventDefault() is turned off in this test, see 1
          return;
        if (e.key !== "Tab")
          return;
        const inputTextareas = document.querySelectorAll("input, textarea");
        e.shiftKey ? FocusController.tabIndex-- : FocusController.tabIndex++;
        if (FocusController.tabIndex >= inputTextareas.length)
          FocusController.tabIndex = 0;
        const focusTarget = inputTextareas[FocusController.tabIndex];
        const task = setTimeout(function () {
          focusTarget.focus();
        });
      }
    };

    window.addEventListener("mousedown", FocusController.onMousedown, true);
    window.addEventListener("keydown", FocusController.onKeydown, true);

    function log(e) {

      console.log(e.target.id + "." + e.type);
      setTimeout(function () {
        console.log("activeElement: " + (document.activeElement.id || document.activeElement.tagName));
      });
    }

    window.addEventListener("mousedown", log);
    window.addEventListener("keydown", log);
  })();
</script>
```

The FocusController listens for *two* events, `mousedown` and `keydown`. It then checks the value of these triggering events and decides to call `.focus()` and on which element to call `.focus()`. The FocusController is very naive, and implements only a fraction of the functionality for `keydown`. For example, `tabindex` is not supported, nor is the ability to focus on the addressbar and other browser buttons represented.

 <!--
todo make a chapter about the `tabindex` attributes as a means to control an event controller via the DOM.
 -->

## References

 * dunno