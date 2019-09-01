# Pattern: AttributableEvent

## HowTo: `draggable`

Native drag'n'drop events enable the user to simply implement drag'n'drop functionality for mouse gestures. However, the extra events and processing involved in drag'n'drop can be tax the browsers resources, and so drag'n'drop does not apply to all elements, by default. Drag'n'drop must be activated.

To activate drag'n'drop, an element must be marked with a `draggable` attribute. If the `mousedown` occurs on a target (including ancestors) that has *no* `draggable` attribute, then *no* `drag` events will be dispatched. The drag **events are turned on/of using an attribute**.

## HowTo: filter events based on attribute?

Turing events on/off using attributes is a pattern we call AttributableEvent. And to make a composed event specific to certain element instances, two things must happen:

1. The element is marked with an attribute that specifies it as having this event. Attributes is a cross-linguistic HTML means that can be read from JS, CSS, and events too: attributes is the HTML-way to say something that can be heard by JS, CSS, and events too.

2. When the event trigger occurs, the composed event will search the target (chain) to find an element marked with a particular attribute. This is done by filtering out only the events which include a target marked with the given attribute. 

An composed event initially listens for a trigger event on all elements in the DOM, but then filters out trigger event if their target (chain) does not have an attribute. The AttributableEvent restricts the domain of operation in the DOM.

The AttributeFilteredEvents mostly require a pure `filterOnAttribute(name)` function. The  `filterOnAttribute(name)` finds the first element in the target chain with the required attribute, and then dispatching the custom, composed event on that element. The AttributableEvent pattern *can* also search for an attribute on the end target, and exclude ancestors in the target chain, depending on the composed events logic.

## Demo: `echo-click` event filtered on `echo-click` attribute
   
<pretty-printer href="./demo/echo-click.js"></pretty-printer>

1. The `filterOnAttribute(e, attributeName)` finds the first target in the target-chain with the specified `attributeName`. If no such element exists, it returns `undefined`.
2. If no new target is filtered out, the trigger function simply aborts.

Put into action, the events can be filtered on attribute. Below is a demo of the filtered `echo-click` in action.

<code-demo src="demo/echo-click.html"></code-demo>

## References

 * 
                                                                            