# Pattern: EventSpawnEvents

Some events can trigger *many* possible, subsequent events:
 * `mouseup` can produce an `auxclick` event, a `click` event, or a `click` and a `select` event.
 * `mousedown` can produce either a `focus` event, `contextmenu` event, or no event at all.

## Demo: native `mousedown` event cascade

```html
<input type="text" value="Hello sunshine!"/>

<script>
  function log(e){
    console.log(e.type);
  }

  window.addEventListener("mousedown", log);
  window.addEventListener("focusin", log);
  window.addEventListener("contextmenu", log);
</script>
```

The following actions produce the following events:
 * Mousedown with primary button when the `<input>` doesn't have focus: `mousedown`, `focusin`.
 * Mousedown with primary button when the `<input>` already has focus: `mousedown`.
 * Mousedown with right button when the `<input>` doesn't have focus: `mousedown`, `focusin`, `contextmenu`.
 * Mousedown with right button when the `<input>` already has focus: `mousedown`, `contextmenu`.

## Demo: Parallel EventControllers

We can conceptually view this process as being driven by *two, parallel* EventControllers:
1. FocusController 
2. ContextmenuController
 
Both the FocusController and the ContextmenuController are described in previous chapters. We now simple run them together.

The demo below:
1. completely blocks all the native `click` events, and 
2. adds a custom `ContextmenuController` object that listens for `mousedown` events.
3. adds a custom `FocusController` object that listens for both `mousedown` and `keydown` events.

```html
<input type="text" value="Hello sunshine!"/>
<input type="text" value="Hello world!"/>

<script>
  //1. block the native events
  window.addEventListener("contextmenu", e=> e.preventDefault(), true);
  window.addEventListener("mousedown", e => e.preventDefault(), true);
  window.addEventListener("keydown", e => e.preventDefault(), true);
       
  //2. custom `ContextmenuController` object that listens for `mousedown` events. 
  const ContextmenuController = {
    onMousedown: function (mousedownEvent) {
      if (mousedownEvent.button !== 2)
        return;
      const myContextMenuEvent = new MouseEvent("my-contextmenu", {composed: true, bubbles: true});
      const task1 = setTimeout(function () {
        mousedownEvent.target.dispatchEvent(myContextMenuEvent);
      });
      const task2 = setTimeout(function () {
        alert("this is a bad excuse for a context menu..");
      });
      Object.defineProperty(myContextMenuEvent, "preventDefault", {
        value: function () {
          clearTimeout(task2);
        }
      });
    }
  };
  window.addEventListener("mousedown", ContextmenuController.onMousedown, true);
  
  //3. custom `FocusController` object that listens for both `mousedown` and `keydown` events.
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
  

  function log(e){
    console.log(e.type);
  }

  window.addEventListener("mousedown", log);
  window.addEventListener("keydown", log);
  window.addEventListener("my-contextmenu", log);
  window.addEventListener("focusin", log);
</script>
```

When you right click on the `<input>` elements, you should receive a custom `my-contextmenu` event with a poor excuse for a show context menu action, and a have a custom focus controller call `.focus()` on the appropriate elements.  
 
## References

 * dunno