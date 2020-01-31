# Pattern: EventSequence

Events can also produce other events:
 * A `keypress` is made up of a `keydown` and a `keyup` for the same character.
 * A `dblclick` is made up of two `click`s in quick succession.
 * A `dragstart` is created when a certain `mousedown` is coupled with a certain `mousemove`.
 * todo add other examples.  

When *two* or more events produce *one* or more other events, the browser needs to observe parts of the event sequence to discover the pattern. This means that the browser needs to:
1. not only listen for more events, often of different types, but
2. also *store* information about the previous events.

The browser needs to store *state* information about the *sequence* of events that has occurred in *the current session*. 

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
If you press "a" and then "Tab" you get the following result:
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
 * Only *some* keys produce keypresses. `keydown` and `keyup` on "Tab" does not produce a `keypress`.
 * If we hold down a key for more than ms (depends on your OS settings for the keyboard), the browser will receive a new `keydown` events *roughly every 33ms* for the same key. These 33 `keydown`s per second events will also produce a `keypress` event.

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

## Demo 2: `dblclick`

`dblclick` is another good example of an EventSequence because it:
1. only listens for *one* trigger event, but
2. still has to *store* the state of the previous `click`
3. in order to calculate if *two* `click`s are close enough in time to be a `dblclick`.

```html
<h1>Hello sunshine!</h1>

<script>
  (function () {
    function log(e) {
      console.log(e.type + ": " + e.timeStamp);
    }

    window.addEventListener("click", log);
    window.addEventListener("dblclick", log);
  })();
</script>
```
Results in:
```
click: 2351.519999996526
click: 2519.5200000016484
dblclick: 2523.300000000745
```        

To implement our custom DblclickController is simple:

```html
<h1>Hello sunshine!</h1>

<script>
  const DblclickController = {
    lastTime: undefined,          /**STATE**/
    onClick: function (e) {
      if (!DblclickController.lastTime)
        return DblclickController.lastTime = e.timeStamp;
      const duration = e.timeStamp - DblclickController.lastTime;
      if (duration > 300)
        return DblclickController.lastTime = e.timeStamp;
      DblclickController.lastTime = undefined;
      setTimeout(function () {
        e.target.dispatchEvent(new MouseEvent("my-dblclick", {bubbles: true, composed: true}));
      });
    }
  };

  window.addEventListener("click", DblclickController.onClick, true);

  (function () {
    function log(e) {
      console.log(e.type + ": " + e.timeStamp);
    }

    window.addEventListener("click", log);
    window.addEventListener("my-dblclick", log);
  })();
</script>
```

## Event controller & state

Until now, our event controllers themselves have not preserved any internal state. And this sea-change needs our attention:
 
The FocusController remembered which element had focus between its triggering events. But. The FocusController relied on an external property in the DOM, the `document.activeElement`. Yes, the state of `document.activeElement` is essential to the FocusController, but the `document.activeElement` is not "hidden inside the event controller".

On the other hand, the `KeypressController` and `DblclickController` above have an internal state that is *a hidden, internal state*. No other part of the system has access to this data, and the browser intends to hide this data and free the developer from ever knowing/caring about them.

There is a *dramatic* consequence that arise when event controllers start having state: it makes the need for us to modularize them 10x greater. To see this clearly, lets turn this statement on its head.
 
To have one, big GodEventController *could* be feasible if event controllers never had any internal state. If the event controller functions were essentially pure and produced the same set of outputs for their inputs, we can imagine having one function that listens for say `mouseup` and then inside that function run a series of if-then queries that essentially checked all the possibilities for `mouseup`. But, when some of the decisions for `mouseup` depends on previous events such as `mousedown` and/or `mousemove` and/or `focus` etc., then the *one GOD function per trigger event*-concept  becomes unmanageable. 

There are other reasons to that the GOD event controller is not a good idea. It doesn't scale. And it cannot be extended (how do you add an if-then check inside such a GOD controller?). But the state is the first thing that compels us to modularize our event controllers.


## References

 * dunno