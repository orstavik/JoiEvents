# Problem: PreventDefaultClick

`click` is a composed event. The browser runs a native EventSequence that observes `mousedown` and `mouseup` events and then produces a `click` event. Basically, this EventSequence checks that:
 * the `mousedown` and `mouseup` occurs on the same target element,
 * is pressed for a short enough duration, and
 * the cursor does not move too much during the press.
  
Both the duration of the press and the accepted movement depends on *both* the browser implementation *and* the user's mouse settings. 

## `click` is special

`click` has been around as long as there has been HTML and browsers. If a web page only exists of texts and links, then all the events you need are method to select targets and `click`.

I suspect that legacy is the reason `click` is given its special status: **`click` cannot be prevented**. Calling `preventDefault()` from `mousedown` or `mouseup` will not stop an ensuing `click` if the browser detects it. And this can be a problem for custom mouse and touch EventSequences.

## How to prevent inevitable `click`s?

There are several ways to create a `click`:
 * the user presses the primary mouse button down and up,
 * the user presses a finger down and up on an element,
 * a script calls `.click()` on an element,
 * a script dispatches a `new ClickEvent()` on an element,
 * and more.
 
Composed events might listen for all types of `click` events. For example, a `tripple-click` might very well listen for script produced `click`s. However, composed events need only prevent `click`s that are preceded by mouse and touch events.

Furthermore, `touchstart` and `touchend` events do not directly produce the `click` event. In order for a touch gesture to produce a `click`, the `touchstart` and the `touchend` events first *echo* a `mousedown` and a `mouseup` event that in turn trigger the `click` EventSequence. This means that both a mouse and touch based `click` is preceded by a `mouseup` event.

Thus, we are left with the following problem:
 * can you tell from a `mouseup` event listener if it will trigger an ensuing `click` event? or
 * can you tell from a `click` event listener if it was triggered from a `mouseup` event (and not produced by a script)?

Unfortunately, the answer to both these questions is "no, not directly". But, there are indirect ways to gauge if a `click` event was created by a `mouseup` event.

1. When a `mouseup` event triggers a `click` event, both events will share the following properties: `isTrusted` (true), and x and y coordinates. When a script produces a `click` event, it will be `isTrusted === false` it will have x and y coordinates = 0. 

   But. The x and y coordinates are not unique to each `mouseup` and `click` event. For example, a user *can* on the exact same place two times in a row, the first time too long for a `click` to be produced, and the second time short enough. Thus, simply looking at `isTrusted` and the events coordinates is not enough.

2. If a `click` is induced by a `mouseup` event, it will be placed in the task que *before* a `setTimeout(..., 0)` task queued from the `mouseup` event. This means that if a `click` event listener is processed *before* a setTimeout function queued from a `mouseup` event listener, then the `click` event in that `click` event listener was either produced by the native `click` EventSequence or by a synchronous script calling `.click()`.

Both of these two indirect methods gives us the ability to identify `click` events that were *not* produced by the native `click` EventSequence, and if we combine these two methods, we get an accurate enough estimate of when a `click` event in fact was produced by a `mouseup` event.

## Implementation

An EarlyBird cancel listener is complemented with a timed task that will remove the cancel listener if it does not happen before the next timed task. The EarlyBird will also remove the timed task if it is triggered, thus reducing load. The `preventDefaultClick(...)` must be called from inside a `mouseup` event listener. 

```javascript
function preventDefaultClick(mouseupEvent) {
  if (!mouseupEvent.isTrusted)
    return;
  let timedTask, onceTask;
  onceTask = function (e) {
    if (!e.isTrusted)
      return;
    if (e.clientX !== mouseupEvent.clientX ||e.clientY !== mouseupEvent.clientY)
      return;
    e.stopImmediatePropagation? e.stopImmediatePropagation() : e.stopPropagation();
    e.preventDefault();
    window.removeEventListener("click", onceTask, true);
    clearTimeout(timedTask);
  };
  timedTask = setTimeout(function(){
    window.removeEventListener("click", onceTask, true);
  }, 0);
  window.addEventListener("click", onceTask, true);
}
```
Below is a demo of how things work.

<code-demo src="./demo/PreventDefaultClick.html"></code-demo>

## Comment

Mouse and touch EventSequences should most likely only listen for `.isTrusted === true` events. However, leaving open the ability to take in and react to programmatic events also enable scripts to interact with the EventSequence, which is necessary for testing and which is beneficial for patches if needed.

## References

 * [w3.org: Trusted events](https://www.w3.org/TR/uievents/#trusted-events)