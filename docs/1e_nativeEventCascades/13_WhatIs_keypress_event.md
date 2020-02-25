# WhatIs: `keypress`?

The `keypress` event is bla bla bla.

what is all these different .key and .code and .char?? properties?

* Some events use the passage of time as an alternative trigger event. 
* The keypress demo below also filters events. 

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

We make a `KeypressController` to mirror the behavior of the browser. From the first demo, we can see that the browser produce `keypress` events:
 * only for *some* keys such as "a", but not for others such as "Tab",
 * just before the `keyup` event occurs when it has also registered a `keydown` event for that key earlier, and
 * just before the next `keydown` event, if the browser receives multiple `keydown` events as a consequence of the user holding down a key on the keyboard. 

```html
<input type="text" value="Press 'a', 'Tab' and hold down 'x' for a second." />

<script>
  (function () {
    const KeypressController = {
      downers: {},                    /**STATE**/
      keydown: function(e){
        if (e.key === "Tab")
          return;
        if (KeypressController.downers[e.key])
          e.target.dispatchEvent(new CustomEvent("my-keypress", {key: e.key});
        else
          KeypressController.downers[e.key] = true;
      }, 
      keyup: function(e){
        if (!KeypressController.downers[e.key])
          return;
        KeypressController.downers[e.key] = false;
        e.target.dispatchEvent(new CustomEvent("my-keypress", {key: e.key});
      } 
    };
    window.addEventListener("keydown", KeypressController.keydown, true);
    window.addEventListener("keyup", KeypressController.keyup, true);

    function log(e) {
      console.log(e.type + ": " + e.key);
    }

    window.addEventListener("keydown", log);
    window.addEventListener("keyup", log);
    window.addEventListener("my-keypress", log);
  })();
</script>
```

## References

 *
