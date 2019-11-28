# Problem: CascadeChaos

To support legacy web pages that only implement support for mouse events, mobile browsers automatically spawns `mousedown`/`mouseup` events from `touchstart`/`touchend` events.

## Example 2: Native composed events (touchend -> mouseup -> click)

<code-demo src="demo/TouchendMouseupClick.html"></code-demo>

The `click` event is composed from a pair of preceding:
 * `touchstart`+`touchend` events, if the original action was a touch event, or
 * `mousedown`+`mouseup` events, if the original event was a mouse event.

## Legacy of DefaultActions

If some of the defaultActions make you feel iffy, you're not alone. This is how the spec itself describes it: 
> "Activation behavior exists because user agents perform certain actions for certain EventTarget objects, e.g., the area element, in response to synthetic MouseEvent events whose type attribute is click. Web compatibility prevented it from being removed and it is now the enshrined way of defining an activation of something. " [Whatwg.org](https://dom.spec.whatwg.org/#eventtarget-activation-behavior)

Put simply, if they could clean them up, they would have. But they can't.

Grievance is an emotion that helps you remember who and what hurt you. And this helps you avoid situations and remember dangers so you don't get hurt again. In moderation, healthy grievances.
 
So, here is my list of healthy grievances for event cascades in the browser:

1. All events *should* `bubble`. Events in the DOM that don't bubble are all old, and have newer, bubbling alternatives (or `MutationObserver`).
2. Why are not the sequence capture frist, then bubble maintained on the target element during propagation. Why are the order of all event listeners FIFO on the target? Why? Why can someone please give me a rational, and not political reason why?
3. DefaultActions are really invisible CascadingEvents. They only propagate off the DOM, amongst native functions, not in the DOM, amongst JS event listeners. And vice versa, cascading events are all in principle a defaultAction of another trigger event. They are all part of the same event cascade, the event-driven framework of the web.
5. Redrum: TouchSimulateMouse. The chaos that is mouse events generated from touch events is so bad Im at a loss for words. And the biggest bomb herein is that it is somehow ok for the browser to have individual preferences for the order in which events cascade. For some reason, it is less important to keep event cascades universal than other stuff. The appropriate approach for you as a web developer facing that wisdom is to say: "yeah, that is really smart". And walk away.
6. It is unpreventable that you will forget which events are preventable, and which are not. Be proud if you remember that `click` is unstoppable.
7. It would be nice if we could trigger the default context menu from JS. But we can't. I'm sure its because some guy can hack me using only the contextmenu. Hm... When you have those hacking skills, I kinda feel he should be allowed to do it. 

## References

 * [Lauke: event order table](https://patrickhlauke.github.io/touch/tests/results/)