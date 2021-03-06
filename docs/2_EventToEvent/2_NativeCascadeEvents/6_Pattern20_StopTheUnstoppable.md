# Pattern: StopTheUnstoppable

> Prevent the inevitable. Think the unthinkable.

## Why stop native CascadeEvents?

The browser produce many native cascade events. `dblclick` is made when two `click` events occur on the same `target` in quick succession. Sometimes these native CascadeEvents needs to be stopped from one of their triggering events, so as not cause errors or complicate the code needlessly. For example, a script might need to block:
  
  * a `click` from being generated by a `mousedown` and `mouseup` sequence (cf. the PreventDefaultClick pattern),
  
  * a `selectstart` event from a touch or mouse event sequence,
  
  * a `contextmenu` event from a touch or mouse event sequence,
  
  * a `dblclick` event from a native `click` event sequence,
  
  * etc.

Stopping such native CascadeEvents is *sometimes* done by calling `.preventDefault()` on one of the preceding trigger events. If you call `.preventDefault()` on a `touchstart` event, then no `mousedown`, `contextmenu` (WRONG!!), `selectionstart`, `click` nor other event will occur.

Another means to block native, CascadeEvents is setting specific CSS properties. If you  for example set `user-select: none` on a target element from within a `touchstart` event listener, then no subsequent `selectstart` event and its subsequent text selection default action will occur. 

## What makes an event unstoppable?

But. Most often, stopping native CascadeEvents is not as easy. And there are three reasons why:

1. Most native, CascadeEvents are simply **unstoppable**. They will be dispatched even when you call `.preventDefault()` on one of their trigger events, and there are no CSS properties nor HTML attributes nor anything else you can set to block them. The list of unstoppable, native, CascadeEvents include:

   * `click` (cf. PreventDefaultClick)
   * `contextmenu` 
   * `dblclick`
   * ...
   
2. Sometimes the native trigger events are passive (`cancelable: false`). Chrome for example can produce passive `touchstart` and `touchend` events to speed up scrolling (cf. the PassiveAggressiveTouchstart pattern). In such instances, calling `preventDefault()` on them will not work.

3. `.preventDefault()` blocks everything. So what if you *only* wanted to block the `contextmenu` during a touch event sequence, but not block scrolling, `click`ing, and other subsequent event sequences? 

In all the scenarios above, you end up with a native, CascadeEvent that you cannot block from one of its preceding trigger events. So then what do you do?

## Can't stop? Abort!

When you can't stop something from occurring, you should abort it immediately! 
 * To capture an event asap, add an EarlyBird event listener a) in the capture-phase b) on the `window` object. 
 * To abort an event, you `stopPropagation()` and `preventDefault()`.
 
```javascript
function cancelEventOnce(type) {
  const oneTimer = function (e) {
    e.stopImmediatePropagation? e.stopImmediatePropagation(): e.stopPropagation();
    e.preventDefault();
    window.removeEventListener(type, oneTimer, true);
  };
  window.addEventListener(type, oneTimer, true);
}
```
## HowTo: abort an abortion?

But. There is a problem with the setup above. This function *only* works if you know that:
 * only *one* such `cancelEventOnce(...)` function is added per native EventSequence and
 * that this event *must be* called.

But, this is rarely the case. 
 * The browser often does *not* dispatch a possible native CascadeEvent. And it rarely possible to know when a native CascadeEvent will be dispatched in advance. For example, the exact same sequence of clicks might trigger a `dblclick` in one user's browser and not in another, depending on the browser and user mouse settings that cannot be safely read.
 * If several CascadeEvent functions listen for the same native trigger events (such as `click`), it is not unlikely that more than one such CascadeEvent function might call `cancelEventOnce(...)` for the same trigger events.

In such circumstances, the listener that aborts the native CascadeEvent will be installed by `cancelEventOnce(...)` function, but linger on until a later point when it might suddenly strike unexpected. So, if we do not use the oneTimer listener for the current event sequence, we must remove it. We must abort the abortion.

How we remove the `cancelEventOnce()` function depends on the nature of the native CascadeEvent:
1. Some native CascadeEvents can be in an EventSequence, remove the cancelling event listeners when the sequence ends, or
2. use a `setTimeout(()=> window.removeEventListener(type, oneTimer, true), 0)` to abort the abortion if it was not used immediately.

Which method to use depends on the CascadeEvent function. And it can be quite tricky. Below is an example of a function that uses `setTimeout` approach to stop an unstoppable `dblclick`:

```html
<script>
  function preventDefaultDblClick() {
    let timedTask, onceTask;
    onceTask = function (e) {
      e.stopImmediatePropagation? e.stopImmediatePropagation() : e.stopPropagation();
      e.preventDefault();
      window.removeEventListener("dblclick", onceTask, true);
      clearTimeout(timedTask);
    };
    timedTask = setTimeout(function(){
      window.removeEventListener("dblclick", onceTask, true);
    }, 0);
    window.addEventListener("dblclick", onceTask, true);
  }
</script>
<h1>Hello sunshine, you cannot dblclick on me!</h1>
<script>
document.querySelector("h1").addEventListener("click", e => preventDefaultDblClick(e))
</script>
```
The function above is slightly naive. Yes, it will abort a single `dblclick` that occur after a `click` event up until the next `setTimout(..., 0)` task. And it will abort the abortion if this doesn't happen before the next `setTimeout()` task. But. The function does not take into account `dblclick` events that are created and dispatched by a script from within a `click` event listener. It also does not take into account problems that might arise if the `setTimeout(..., 0)` task is delayed for some reason for `click` events that do not trigger a `dblclick`. For more details on this, see PreventDefaultClick pattern.

## Example 1: CancelClickOnce

<code-demo src="demo/PreventDefaultDblClick.html"></code-demo>

## Table 1: overview of preventable and unstoppable CascadeEvent cascation

trigger -> | intermediate -> | composed | stop via css | stop via preventDefault | unstoppable
---        | ---             | ---      | ---          | ---                     | ---        
touchstart | touchend   | click    |              | maybe?                  | maybe?
touchend   |            | click    |              | maybe?                  | maybe?
mouseup    |            | click    |              |                         | X
wheel      |            | scroll   | no?          | yes?                    | no?
click      |            | contextmenu | no?       | NO!                     | X
mouseup    |            | contextmenu | no?       | NO!                     | X
mousedown  |            | contextmenu | no?       | NO!                     | X


## Table 2: overview of duplicatable defaultActions

 native event       | defaultAction     | duplicatable 
---                 | ---               | ---              
contextmenu         | show context menu | NO
click on <a href>   | navigate to page  | YES: location = new URL(nativeEvent.target.href).href;

## References

 * [MDN: `preventDefault()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
 * [Stackoverflow: cancelClick](https://stackoverflow.com/questions/17441810/pointer-events-none-does-not-work-in-ie9-and-ie10#answer-17441921)
 * [CSS-tricks: pointer-events](https://css-tricks.com/almanac/properties/p/pointer-events/)