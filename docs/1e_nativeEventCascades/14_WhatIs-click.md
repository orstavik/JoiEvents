# WhatIs: `click`?

auxclick and dblclick and click. Here, the problem is to find the common hit target.

## Demo: `dblclick`

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

On the other hand, the `DblclickController` above has an internal, *hidden* state. No other part of the system has access to this state data, and the browser intends to hide this data and free the developer from ever knowing/caring about them.

There is a *dramatic* consequence that arise when event controllers start having state: it makes the need for us to modularize them 10x greater. To see this clearly, lets turn this statement on its head.
 
To have one, big GodEventController *could* be feasible if event controllers never had any internal state. If the event controller functions were essentially pure and produced the same set of outputs for their inputs, we can imagine having one function that listens for say `mouseup` and then inside that function run a series of if-then queries that essentially checked all the possibilities for `mouseup`. But, when some of the decisions for `mouseup` depends on previous events such as `mousedown` and/or `mousemove` and/or `focus` etc., then the *one GOD function per trigger event*-concept  becomes unmanageable. 

There are other reasons to that the GOD event controller is not a good idea. It doesn't scale. And it cannot be extended (how do you add an if-then check inside such a GOD controller?). But the state is the first thing that compels us to modularize our event controllers.


## References

 * dunno