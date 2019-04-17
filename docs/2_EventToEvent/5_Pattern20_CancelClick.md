# Pattern: CancelClick

`click` is an event that can be composed from a `mousedown`+`mouseup` or `touchstart`+`touchend` 
pair on the same DOM element. To cancel the trailing, composed `click` event from a 
`touchstart`+`touchend` pair is simple: call `.preventDefault()` on the `touchend` event.

But. To call `.preventDefault()` on the `mouseup` event does not work: the `click` event cannot
be cancelled from the mouse events. Therefore, we need a different technique to prevent the 
`click` event from `mouseup`.

## HowTo: `cancelEventOnce("click")`

The next best thing to be able to prevent the `click` event from occurring, is to stop its propagation
and defaultAction as soon as possible. We do this by adding an event listener for the next `click` 
that *first* calls `stopPropagation()` and `.preventDefault()` on the event, and *then* removes itself.

```javascript
function cancelEventOnce(type) {
    const oneTimer = function (e) {
      e.stopPropagation();
      e.preventDefault();
      window.removeEventListener(type, oneTimer, true);
    };
    window.addEventListener(type, oneTimer, true);
  }
```
 * Use `stopPropagation()`, not `stopImmediatePropagation()`. 
   If, for some reason, this `cancelClickOnce()` is called twice, 
   `stopPropagation()` will work just fine, while `stopImmediatePropagation()` will cause the two or 
   more `click`s to be canceled. 

## Example 1: CancelClickOnce

```html
<div id="test">
  <div id="box">
    <h1 id="sunshine">Hello sunshine!</h1>
  </div>
  <form action="#HelloSunshine">
    <input value="click for sunshine!" type="submit">
  </form>

  <a href="#helloWorld">hello world</a>
</div>

<script>
  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type);
  }

  const test = document.querySelector("#test");
  //logs
  test.addEventListener("submit", log);
  test.addEventListener("click", log);
  test.addEventListener("mouseup", log);
  test.addEventListener("touchend", log);

  function cancelEventOnce(type) {
    const oneTimer = function (e) {
      e.stopPropagation();
      e.preventDefault();
      window.removeEventListener(type, oneTimer, true);
    };
    window.addEventListener(type, oneTimer, true);
  }

  test.addEventListener("mouseup", function () { cancelEventOnce("click"); });

</script>
```

> Other approaches such as setting a temporary `pointer-events: none` somewhere in the DOM during the 
> `mousedown` event, doesn't work. Your best and simplest bet is to `cancelClickOnce()` during the 
> `mouseup` event.

## References

 * [Stackoverflow: cancelClick](https://stackoverflow.com/questions/17441810/pointer-events-none-does-not-work-in-ie9-and-ie10#answer-17441921)
 * [MDN: pointer-events: none](https://css-tricks.com/almanac/properties/p/pointer-events/)