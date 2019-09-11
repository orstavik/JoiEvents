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

Unfortunately, the answer to both these questions is "no, not directly". But, there is an indirect way to link `click` events to their preceding `mouseup` events. It consists of two steps:

1. When a `mouseup` event triggers a `click` event, they will share the same `x` and `y` coordinates. When a script produces a `click` event, it will not have any `x` and `y` values.  