# Pattern: AttributeFilteredEvent

The native drag'n'drop events do not apply to all elements. In order for drag'n'drop events to fire, a `draggable` attribute must be attached to the elements that the drag gesture is performed on. The drag **events are turned on/of using an attribute**. This pattern we call AttributeFilteredEvents

## HowTo: filter events based on attribute?

To make an event specific to certain element instances, two things must happen:

1. The element must be marked as having this event. This is done by adding an attribute to that element.
   (Attributes is the inter-linguistic marker for HTML elements available to both HTML, JS and CSS.
   If you want an aspect of an HTML element to be accessible in a universal context, you use attributes.)

2. The originally DOM-universal event trigger function must be restricted to be applied only to the 
   marked elements.
   This is done by filtering out only the events which include a target marked with the given attribute. 

To implement the AttributeFilteredEvents pattern is simple. You need a pure `filterOnAttribute` function 
that finds the first target with the required attribute, and then dispatching the custom, composed event
on that element.

## Demo: `echo-click` event filtered on `echo-click` attribute
   
<pretty-printer href="./demo/echo-click.js"></pretty-printer>

1. The `filterOnAttribute(e, attributeName)` finds the first target in the target-chain with the
   specified `attributeName`. If no such element exists, it returns `undefined`.
2. If no new target is filtered out, the trigger function simply aborts.

Put into action, the events can be filtered on attribute. Below is a demo of the filtered `echo-click`
in action.

<code-demo src="demo/echo-click.html"></code-demo>
## References

 * 
                                                                            