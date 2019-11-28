# Problem: CascadeChaos

To support legacy web pages that only implement support for mouse events, mobile browsers automatically spawns `mousedown`/`mouseup` events from `touchstart`/`touchend` events.

## Example 2: Native composed events (touchend -> mouseup -> click)

<code-demo src="demo/TouchendMouseupClick.html"></code-demo>

The `click` event is composed from a pair of preceding:
 * `touchstart`+`touchend` events, if the original action was a touch event, or
 * `mousedown`+`mouseup` events, if the original event was a mouse event.

## References

 * [Lauke: event order table](https://patrickhlauke.github.io/touch/tests/results/)