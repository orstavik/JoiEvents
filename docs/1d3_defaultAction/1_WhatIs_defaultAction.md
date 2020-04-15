# WhatIs: default action?

> https://www.w3.org/TR/uievents/#event-flow-activation

A "default action" is a **reactive function** (task) the browser execute by "default" when certain events occur. The default action alters the state of the DOM (cf. changing the value of a checkbox, changing `document.scrollTop`, or navigating to a new page). Most such DOM mutations are permanent, but some might be temporary (cf. `contextmenu`). Many of the functions triggered by an event's default action also spawn new past- or future-tense events themselves (cf. the `submit` and `reset` events being spawned from the default actions of `click`s on `<button type="submit">` and `<button type="reset">`).

## Matching default actions to events.

There can be **many different default actions associated with one event type**. For example, the `click` event can both have a default action of toggling the value of a checkbox, navigating to a new page from a link, resetting a form, and more. 

But, there can be **only one default action per one event instance**. Hence, when the browser must find out which default action should be associated with a particular event instance. For example, the `click` event can trigger both the action of resetting a `<form>` and navigating to a new page, but the browser will *never* run both of these default actions for the same `click` event, it will run either one or none.
 
The browser's basic principle for finding which default action matches which event instance is to:
1. map the different default actions of **event type** to an **HTML type/attribute**, and then 
2. **search the propagation path bottom-up**, for each event instance, to find the first element whose HTML type/attribute matches that of the event instance's type.

> The default actions that is nearest the `target` in the propagation path wins.

Hence, events trigger default actions, but **DOM elements control the selection of default actions**. So, when you make reusable web components (your own custom HTML type), you should consider what type of default actions it requires, and this default action should be managed from the code of that element (or element group).

## Event propagation, then default action 

The default action is always **run directly *after* the event propagation** has completed and ***before* the next event** in the event loop. The execution of a default action is blocked if somebody calls `.preventDefault()` on the event instance during its preceding event propagation.  

> There are two notable exceptions where the default action is executed *before* event propagation, and not after it: `click` on `<input type="checkbox">`, and `scroll` from touch in Chrome. These two instances are both problematic, and will be discussed in detail later.

Default actions are mostly associated with async events. **Default actions on async events run as a separate macrotask** immediately after event propagation finishes. This makes sense as you would like all microtasks spawned from event listeners to run before the control of flow is passed to the default action.

However, sync events are known to produce default actions too. **Default actions on sync events run within the same microtask** that triggered them, ie. the default action will be executed *before* the microtasks spawned from preceding event listeners for the same event. For example, when you call `.requestSubmit()` you trigger potentially a sync `invalid` event and/or a sync `submit` event, both of which will run their default action sync. This is a problem which will discuss in more detail later.

It is a mistake to make web components with default actions that run as regular event listeners. Such web components will trigger their state changing actions (from the shadowDOM context) midway in the event's propagation (in the lightDOM context), thus causing unexpected state changes (from the perspective of the lightDOM event propagation). Default actions should happen as a separate task, separate from the trigger event's propagation. 

## Native flow of default actions 

The browser runs default actions as tasks that immediately follow the propagation of the same event instance. It is as if the browser runs the default action as if it was the last event listener associated with the event, an event listener which cannot be blocked by `.stopPropagation()`, but instead is blocked by `.preventDefault()`. 

```
propagate(eventA) => DefaultAction(eventA)
    ↓    ↑             if (!eventA.defaultPrevented)
  cap    bub             findLowestDefaultAction(eventA)
    ↓    ↑                ↑ parent  (+)
  cap    bub              ↑ parent  (+) => x, run this default action
    ↳tar ⮥                ↑ target  (-) 
```

Often, the default action of one event will trigger another event with yet another default action. The events and default actions then form a cascade with the domino effect of one event triggering an action triggering another event triggering yet another action, etc. This would form the following flow of control: 

```
propagate(eventA) => DefaultAction(eventA) => propagate(eventB) =>  DefaultAction(eventB) 
    ↓    ↑            ↑ parent                    ↓    ↑             ↑ parent         
  cap    bub          ↑ parent (actionA)        cap    bub           ↑ parent      
    ↳tar ⮥            ↑ target                    ↳tar ⮥             ↑ target (actionB)        
```

Below is an example of the native flow of control for a `click` on `sunshine` within a `<button type="submit">`.

```
<form>
  <input type="text" value="test">
  <button type="submit">
    <a href="#go">hello</a>
    <span>sunshine</span>
  </button>
</form>

 propagate(click) => DefaultAction(click)      => propagate(submit) =>  DefaultAction(submit) 
    ↓      ↑         ↑ ...                         ↓        ↑             ↑ ...         
  ...      ...       ↑ <button> (.reqSubmit())    ...       ...           ↑ <body>      
    ↳<span>⮥         ↑ <span>                      ↳ <form> ⮥             ↑ <form> (.submit())
```

## WhatIs: `.preventDefault()` and `cancellable`?

Not all native events have default actions associated to them: for example, there is no specific default action associated with `dblclick` (yet). Furthermore, not all instances of event types that *can* have a default action associated with them will: for example, a `click` directly on the `<body>` element will not produce a default action, even though `click` has default actions associated with many different elements.

Event types that in some circumstances *can* have a default action associated with them are called `cancellable`. `cancellable` simply means that if you call `.preventDefault()` on the event instance, the default action associated with the event will be "prevented" from running.

```
propagate(cancellableEvent)    =>|  DefaultAction(cancellableEvent) 
    ↓    ↑                       ↑
  cap    bub ->.preventDefault()⮥     
    ↳tar ⮥        
```

## References

 * spec
 * mdn??
 * good articles?
 * maybe discussion in whatwg