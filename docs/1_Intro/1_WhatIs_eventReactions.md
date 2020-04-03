# WhatIs: event reactions?

There are three different types of functions that react to events in the browser today:

1. event listeners
2. default actions
3. event controllers 

## WhatIs: Event listeners?

Event listeners are regular JS functions that are connected with:
1. a DOM node **instance** and
2. an event **type**.

It is possible to connect many different event listeners to the same node and same type, and when an event is sent into the event system, this event can propagate to many different nodes and many different event listeners. Each event instance can thus trigger multiple event listeners in different order.

Event listeners is by the most familiar type of functions that observe changes to events. Almost the entire, developer-oriented event API of browsers today are geared towards event listeners. Conversely, the browser does not use event listeners for its native functions.

Event listeners are described in detail in the event propagation chapter.

## WhatIs: default actions?

Default actions are native functions in the browser that are connected with:
1. a DOM node **type** and
2. an event **type**.

The DOM node type is often a particular `class` such as `HTMLInputElement`, but it can also be any `HTMLElement`, any element with a particular attribute (cf. `type="checkbox"`, object property(cf. `tabIndex`), or computed style (cf. `touch-action`).
  
Convention dictates that there should only be *one* default action per *one* event instance. This means that if two or more default actions *can be* associated with a particular event instance, the browser must decide upon only one of them.

Default actions are mostly used by the browser itself. JS developers are only exposed to this group of event reacting functions via the `.preventDefault()` method. However, when developers make web components, default actions become more apparent as web component elements need to mimic the behavior of native elements (to both function and behave consistently). 

Default actions, and how you can and should make them in your own reusable web components, are described in detail in the default action chapter.

## WhatIs: event controllers?

Event controllers are native functions in the browser that are connected with:
1. a **sequence** of events of
2. specific **types**.

Event controllers function as a state machine that filter and synthesize a sequence of trigger events into new events and/or other actions. (Event controllers can only have one state and essentially only filter an existing event.)

The most widely known event controllers are the native functions that uses a state machine to generate new events. For example, there is one native function that only observe `click` events and then add a new `dblclick` event to the event loop when two `click` events occur in close succession. Another example is the event controller that filter `mousedown` events to add a `contextmenu` event to the event loop when the right mouse button is pressed. A third example is the event controller that listens for `mousedown` and `keypress` events and then adds `focus`, `blur`, `focusin`, and `focusout` events to the event loop.

These event controllers mainly alter the state of the event loop by adding new events to the event loop. However, event controllers can also alter the state of the event loop by blocking events. For example, the drag'n'drop events will grab/capture all future `mouse...` events, block them and instead dispatch new `drag...` event equivalents. 

Event controllers should not alter the state of the "regular" DOM. However, event controllers can alter the DOM restricted to:
1. **a specific, "owned" dimension of the DOM**. For example, an event controller can add/remove a CSS pseudo-class to a set of nodes in the DOM. However, each CSS pseudo-class is "owned" by an event controller: ie. only *one* event controller can add/remove (write) a pseudo-class to nodes in the DOM. Event controllers can also control JS properties on DOM nodes, such as `.activeElement`, again given the same constraint that the event controller is the only entity with *write* access to that particular property.  
 
2.**specific, "owned" DOM unit**. For example, the event controller that visualize `invalid` event error messages is the only function that can show/hide the error message over `<input>` elements. The content of the error message can be altered via `setCustomValidity(..)` on the `<input>` element, but the positioning, showing, and hiding of the error message is exclusively controlled by the event controller.

> Event controllers operate in their own, exclusive dimension of the DOM.

Because the event controllers access to the DOM is so heavily restricted, multiple event controllers can be triggered by the same event instance. Event controllers are almost completely invisible for the "normal" JS developer. However, event controllers is conceptually the most common way for the browser to associate different events with different functions (even though I am not sure they are implemented in this way).
  
Event controllers, and how you can and should make such reusable components that will not conflict with other functionality in your app, are described in detail in the event controller chapter.

## Overview

```
                  event listeners    default actions    event controllers
                  
specific node            x
node type                                 x
event type               x                x                   x
event sequence                                                x
actions per event      many              one                 many
```

## References

 * 