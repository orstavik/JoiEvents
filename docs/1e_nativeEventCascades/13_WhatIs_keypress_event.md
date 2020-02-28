# WhatIs: `keypress`?

The `keypress` event is dispatched when a key that *likely* would produce a character in a text entry is pressed. `keypress` is a filtered version of `keydown`. This means that all `keypress` events are preceded by a `keydown` event, but not all `keydown` events produce a `keypress` event. `keypress` is also global, ie. a *universally* interpreted event: the browser dispatches the same `keypress` event for all `keydown` events regardless of which element in the DOM has focus.  

## Demo: `keydown`+`keyup`=`keypress` (sometimes)

```html
<input type="text" value="Press 'a', 'Tab' and hold down 'x' for a second." />

<script>
  (function () {
    function log(e) {
      console.log(e.type + ": " + e.key);
    }

    window.addEventListener("keydown", log);
    window.addEventListener("keyup", log);
    window.addEventListener("keypress", log);
  })();
</script>
```                              

If you a) press "a", and then b) "Tab", and then c) hold down "x" you get the following result:

```
keydown: a
keypress: a
keyup: a
keydown: Tab
keyup: Tab
keydown: x
keypress: x
keydown: x
keypress: x
keydown: x
keypress: x
  ...
keydown: x
keypress: x
keyup: x
```

As we can see from this result:
 * Only *some* `keydown` produce `keypress`. For example, `keydown` and `keyup` on `"Tab"` does not produce a `keypress`.
 * If we hold down a key for more than *roughly ?? ms*, the browser will receive a new `keydown` events *roughly every 33ms* for the same key. How long you must hold a key down and how fast it will produce `keydown` events depends on your OS settings for the keyboard. These 33 `keydown`s per second events will also produce one new `keypress` event each.

## Demo: `keydown`+`keyup`=`my-keypress`

We make a `KeypressController` to mirror the behavior of the browser. The `KeypressController` only **filters `keydown` events** so that events that *usually* would produce a character in a text editor field of some kind will produce a `keypress` event. The `KeypressController` is very generic, it doesn't even evaluate the `target` of the `keydown` event.   

```html
<input type="text" value="Press 'a', 'Tab' and hold down 'x' for a second."/>

<script>
  (function () {

    const KeypressController = {
      keydown: function (e) {
        if (e.ctrlKey || e.altKey /* || super, fn, altgr, ++*/)
          return;
        if (e.key === "Tab" || e.key === "F1" || e.key === "Esc" || e.key === "Shift" /* || Home, arrowLeft, ctrl, CapsLock, ++*/)
          return;
        const myKeypressEvent = new KeyboardEvent("my-keypress", {composed: true, bubbles: true, key: e.key});
        setTimeout(() => e.target.dispatchEvent(myKeypressEvent), 0);
      }
    };
    window.addEventListener("keydown", KeypressController.keydown, true);
  })();

  function log(e) {
    console.log(e.type + ": " + e.key);
  }

  window.addEventListener("keydown", log);
  window.addEventListener("keyup", log);
  window.addEventListener("my-keypress", log);
</script>
```

## `keypress` is deprecated! Why?

The main problem with `keypress` is that the interpretation of a key/`keydown` event is not universal. It slightly varies in so many ways, not only between languages and operating systems, but also between elements. This means that the same key/`keydown` event might mean different things when different elements in the same DOM has focus.

For example, if the focus is on a `<textarea>` element, then a `keydown` on the "enter" key means a line break, ie. a `keypress` event for the `\n` character. But, if the focus is on an `<input>` element, then a `keydown` on the "enter" key means the action of submitting the form which the `<input>` element belongs too, ie. no `keypress` event.

To fix this problem, the browsers and W3C standard has decided that the `keypress` event should be deprecated and instead be replaced by the use of another event: `beforeinput`. The `beforeinput` event is not universal, but associated with the currently focused element. This means that an "enter" `keydown` can be evaluated to only mean a `beforeinput` character producing event when a `<textarea>` has focus, and not so when an `<input>` element has focus.

In cases where the `beforeinput` event would not meet your needs, any `keypress` event listener can easily and better be replaced by a `keydown` event listener.  

## References

 * [Why skip keypress](https://www.mutuallyhuman.com/blog/keydown-is-the-only-keyboard-event-we-need/)
