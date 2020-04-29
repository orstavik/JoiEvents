# HowAre: events processed?

When an event occurs in the DOM, the browser passes the event through 3 separate processes:

1. event controllers
2. event propagation
3. default action

```
event 

controller 1     listener capture 1    lowest default action
controller 2     listener capture 2    ----
controller 3     listener target       default action not used 1
                 listener bubble 1     default action not used 2
                 listener bubble 2
```

This is an unfamiliar model for most developers. From the JS perspective, event processing is often viewed as a single process (event propagation) or as a two step process (event propagation + default action). The initial process, event controllers, are not seen by the developers.

So, what is the process of event controllers? When an event occurs, the browser can look at the event and perform some actions that are universal for that event type. For example, the browser runs a function that monitors all `click` events that occur and if two `click`s occur in rapid succession, then the browser will create a `dblclick` event and queue it in the event loop. Another example is the act of `focus`ing on different input elements. The browser will observe `mousedown` and `keydown` events and ensure that whenever a `mousedown` event occurs on an input element or "tab" `keydown` event is made, the `.activeElement` is updated when necessary and dispatch `focusin`, `focusout`, `focus`, and `blur` events. Lots of other event controllers run: `click` created by `mousedown` and `mouseup`; `contextmenu` created by `mousedown` using the right mouse button; drag'n'drop events generated from mouse events; etc. etc.

```
mousedown event on  <input type="date"> 

event controller   event listener mousedown   default action
------------------------------------------------------------------
contextmenu        on window capture          altering date value
focus              on document capture        ---
                   on input element
                   on body element bubble
```
 
## Event processing as triggering functions

When the browser processes an event it simply passes a small data object to three different types of functions:

1. event controllers. The browser can have *multiple* event controller functions associated with the same type of event, and it will pass the event to all event controllers for that event. It does so in "first registered, first run" sequence. Event controllers should *only* do mutations of the DOM that are universal (that would apply the same in any DOM). To ensure that there will be no confusion regarding these state changes, the event controller should *own* all the properties that it alters. To own a property in the DOM in this way means that it is only the event controller that has write-access to that property and can change it; all other parts of the app that uses this property can only read it. Examples of such owned properties is the `.activeElement` JS properties and the `:invalid` css pseudo-class.

   Event controllers are state machines. They can preserve a state of previously observed events. This means that the `dblclick`-controller can remember the `timeStamp` of the previous `click` event, and that the native drag'n'drop state machine can remember which element a preceding `mousedown` event targeted. 

   Event controllers can and do read the DOM in order to regulate themselves. For example, an event controller that controls scrolling from touch can read the state of the `touch-action` CSS property on the target of a `touchstart` event before the `touchstart` event propagates. Other event controllers read HTML attributes (cf. `tabindex`) or element types (cf. `<input>` element for the event controller that regulate validation pseudo-classes such as `:invalid`).

2. Event propagation. When the browser runs event propagation, it sorts all the functions that the is added to elements in the propagation path according to a capture-target-bubble sequence (more on this later). The browser then runs these functions one by one, passing them the event object, until the list of function is empty or one of the functions stops the propagation by calling `stopPropagation()` or `stopImmediatePropagation()`.

   The browser does not add any native functions as event listeners. It is only the developer that adds event listeners to the DOM. 

3. Default action. After the event propagation process has finished, the browser evaluates if any of the event listeners has called `.preventDefault()` on the event. If not, the browser checks the propagation path to see if there are any default actions associated with the given event for any of the elements in the propagation path. The browser will select and run *only one* default action function per event instance, and it searches for this default action from the target of the event and upwards.

## Async vs. sync

Event controllers and default actions are mostly associated with async events. Sync events are most often void of both event controllers and default actions. However, there are exceptions such as calling `.requestSubmit()` and `.reset()` on a `<form>` element will trigger both default actions and event controllers on sync events.

When making custom event controllers and custom default actions, these should be queued asynchronously from the   

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