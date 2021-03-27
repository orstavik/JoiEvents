# HowTo: `.preventDefault()` for bounced events?

There are several issues with native default actions.
1. The edge case of `<input type="checkbox">` that perform their default action state change *before* the `click` event propagates, and has the `clickEvent.preventDefault()` function as a "ctrl+z", extra undo-defaultAction.
2. There is no written rule for what the browser should do in case there are *more than one* default action possible; there is however an unwritten rule that a) only one `preventable` defaultAction should run, and b) that the browser should select the action associated with the elements "nearest" the innermost `target` in the flattedDom.
3. There is no clear description about the relationship between:
   1. `preventable: false` "defaultActions" that an element will associate with an event (such as converting two `click` in quick succession into a `dblclick` event on all `EventTarget`s) and 
	2. `preventable: true` "defaultActions" that an element will associate with an event, unless `preventDefault()` is called (such as making a `click` on an `<a href>` become a navigation action).

There are also several key insights into defaultActions that are important:

1. defaultActions run as if they were *the last event listeners* for each event. If the event is sync (ie. each event listener is not given a macrotask), then the defaultActions run sync; if the event is async, then each defaultAction is also given their own macrotask.
2. If we associate a `preventable: true/false` flag with all actions that the browser can do at the end of an `event`'s propagation, then lots of other event driven actions in the browser such as `dblclick`, `drag'n'drop`, and more, can very well be understood as defaultActions too. DefaultActions then suddenly become a very useful concept, as it gives a clear mechanism for organizing, adding, and reviewing such functionality in the DOM.   

## A fresh start: `bounce` and defaultAction

When event's `bounce`, the event listeners in the upper, "using" DOM context runs *before* the event listeners in the lower, "web component being used" DOM contexts. This means that by calling `.preventDefault()` on an element, and or adding HTML attributes such as `[additive]` on an element, the document that use another web component can use these mechanisms to *control the action of event listeners in that DOM*. This is *exactly* how `preventDefault()` is used to *control* native elements such as `<a href>`. 

The simplest way to implement this is to simply use `e.defaultPrevented` and `e.preventDefault()` as a flag on the event, and then make some event listeners respond to this by:
1. eventListeners in subsequent DOM contexts (in bounce order) check if `e.defaultPrevented` is `true`, and if so, simply return.
2. event listeners that will not run if `e.defaultPrevented` should in most circumstances themselves call `e.preventDefault()` on the event unless directed *not* to so by an attribute such as `additive` added to the `host` node.     
3. if an event listener in a higher DOM sees that this event should *not* trigger the default reaction from a web component (or native element) in that events propagation path, because that DOM context sees another use for that event, then they simple call `e.preventDefault()` as usual.

With `bounce` sequence in place, `e.defaultPrevented` and `e.preventDefault()` simply work out of the box, and by establishing simple conventions such as `[additive]` attributes to prevent a web component from applying its preventable default action exclusively (and turn it inclusive), most if not all use cases can be accomplished. 

## References

*
