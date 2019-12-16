# HowTo: StopPropagation

In the previous chapter we saw how events propagate from:

1. listener to event listener,
2. from element to element, first going down in the capture phase and then up in the bubble phase, and
3. from event type to event type.

If you lift your finger from a `<input type="submit">` button in a browser on a touch-device, then this can trigger a domino-effect going from:
`touchend` -> `mouseup` -> `click` -> `submit`

In the previous chapter we also saw how native and custom events that trigger each other might propagate differently in the third, macro step:
1. Native events propagate one-after-the-other: if one native event such as `mouseup` triggers another native event such as `click`, then `mouseup` will complete its propagation before `click` begins its propagation.

2. Custom events that are dispatched from an event listener on another event will be executed immediately. That means that their propagation most often will be nested, one-inside-the-other:
   1. the inner, secondary event will *temporarily* stop the preceding, triggering event;
   2. the inner event will be completed first; and
   3. then the outer events will *continue* their propagation.

## `stopPropagation()` and `stopImmediatePropagation()` and `preventDefault()`

`stopPropagation()` and `stopImmediatePropagation()` are quite simple and intuitive:

 * `stopImmediatePropagation()` works on the *micro* and *medium* propagation level. 
   It will stop propagation immediately, and not trigger another event listener for the same event type.
   
 * `stopPropagation()` works from the *medium* propagation level. 
   It will stop the event from going to the next DOM element, but it will run all the event listeners
   associated with the same DOM element in the same propagation phase (capture, target, or bubble).
   
But, neither `stopPropagation()` nor `stopImmediatePropagation()` works on the *macro* propagation level. If the native event is to trigger the propagation of another native event type after it has concluded, it will still do so after `stopPropagation()` or `stopImmediatePropagation()` has been called.

To stop *macro* level propagation of an event, use `preventDefault()`. `preventDefault()` does *not* work on neither the *micro* nor the *medium* level. 
It *only* blocks other domino events that might be preceded and triggered by another event.

Att! `preventDefault()` is idiomatic. For example, calling `.preventDefault()` on `mouseup` event will 
not prevent `click`. `preventDefault()` can also block `defaultActions`, ie. native functions the 
browser associates with a particular event such as:
 * navigating to a new web page when you `click` on a link or 
 * scrolling when you roll the `wheel` on your mouse.

Some of this behavior is in turn associated with their own native event such as `submit`, 
while some are not, ie. `click` on links. We will return to these issues in later chapters.

## Example 1: StopPropagation

<code-demo src="demo/StopPropagation.html"></code-demo>

1. `stopPropagation()` stops the *medium* level propagation, but still prints the `log` for the
   sunshine element for the `mouseup` event.
   
2. `stopImmediatePropagation()` stops both the *micro* and *medium* level propagation, so that it
   doesn't print the `log` for the sunshine element for the `touchend` event.

3. `stopPropagation()` (incl. `stopImmediatePropagation()`) has no effect on the trailing, composed
   events: calling `stopPropagation()` on `touchend` does not stop the `mouseup`;
   calling `stopPropagation()` on `mouseup` does not prevent `click`.
   
## Example 2: PreventDefault stops domino events and `defaultActions`

<code-demo src="demo/PreventDefault.html"></code-demo>

The example above illustrate the behavior and problems with `preventDefault()`.

1. As commonly known, `.preventDefault()` on the `click` event will block the browsers defaultAction 
   of navigation to a new page when you `click` on a link.
   
2. The defaultAction of the `submit` event is also blocked using `preventDefault()`.

3. In addition, `.preventDefault()` blocks *all* trailing, composed, domino events on:
   1. `touchend`
   2. `click`
   
   For these *two* event types, `.preventDefault()` function as a *macro* level stopPropagation()
   method.
   
4. But, `.preventDefault()` does *not* block the trailing, composed, domino `click` event on
   the `mouseup` event. Thus, we need a different technique than `.preventDefault()` to safely
   stop propagation into `click` event types. We will look at this in the next chapter

## Example 3: StopPropagation for nested events

<code-demo src="demo/StopEcho.html"></code-demo>

In the example above we see how custom events that are triggered by an event lister on another event 
is exposed and can be prevented by other event listeners that `stopPropagation()` on the triggering
event. This behavior is important to keep in mind when one uses event listeners to dispatch custom
events, which we will return to later in this chapter.

## References

 * [MDN: TouchEvent.preventDefault() stops mouse events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events#Setting_up_the_event_handlers)
 * [MDN: TouchEvent](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent)