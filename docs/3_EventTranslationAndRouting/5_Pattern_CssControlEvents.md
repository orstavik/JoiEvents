# Pattern: CssControlEvents

To implement custom CSS properties to control custom composed events is fairly straight forward:

1. pick a property name, preferable on the form: `--event-type-control-type`

2. If other patterns such as TypedEvent can be used to determine the target or cancel the composed event function, exhaust these calculations first.

3. Then, when the value of the CSS properties/setting for the composed event is needed, call `getComputedStyle(el)` on the target element of the trigger event. If you need to read several settings/CSS properties, read them all at the same time.

4. Parse the CSS property value to a number or other value, and then use this value to control the composed event function.

## Demo: `echo-click` with `--echo-click-times`

In this demo, we will create a custom CSS property called `--echo-click-times`. An `echo-click` is simply an event that echoes a `click`. If the `--echo-click-times` is set on an element, then `echo-click` is repeated as many times as `--echo-click-times` states, with one second intervals. Thus, for elements marked `--echo-click-times: 2`, one `click` will produce two `echo-click`s. If `--echo-click-times: 0`, then no `echo-click` events.
 
```html
<script>
function dispatchEchoEvents(trigger, count) {               
  if (count <= 0)
    return;
  count--;
  const target = trigger.target;
  const echo = new CustomEvent("echo-click", {bubbles: true, composed: true});
  echo.trigger = trigger;
  setTimeout(function(){target.dispatchEvent(echo);}, 0);
  setTimeout(dispatchEchoEvents. bind(null, trigger, count), 1000);
}

function onClick(e){
  if (e.defaultPrevented || e.customPrevented)
    return;
  const count = getComputedStyle(e.target).getPropertyValue("--echo-click-times");
  dispatchEchoEvents(e, parseInt(count)); 
}

document.addEventListener("click", onClick, true);
</script>

<style>
body {
  --echo-click-times: 1;
}
#b {
  --echo-click-times: 3;
}
.c {
  --echo-click-times: 0;
}
</style>

<h1 id="a">Echo once</h1>
<h1 id="b">Echo three times</h1>
<h1 id="c" class="c">No echo</h1>

<script>
  function log(e) {
    console.log(e.type, e.target.id || e.target.tagName, e.timeStamp);
  }
  window.addEventListener("click", log);
  window.addEventListener("echo-click", log);
</script>
```

## Lookahead: CSS controls EventSequences and EventFeedback

CSS controls for composed events can be used to:
 * activate/deactivate the event for selected elements (cf. `pointer-events: none`),
 * control `defaultActions` (cf. `touch-action: pan`),
 * or event specific properties (cf. `--echo-click-times`),
 * and other purposes, depending on the use-case of the composed event in question.
 
Sometimes an app's performance require that it avoids calling `getComputedStyle(..)` during a composed event function. In such instances, HTML attributes is the way to go. But, when we get to EventSequences and Event Feedback, the *importance of* and *quantity* event controlling properties increases. For EventSequences, custom CSS properties to guide composed events is more preferable.

## References
 
  * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
  
