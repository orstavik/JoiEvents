# WhatIs: "default action"

> https://www.w3.org/TR/uievents/#event-flow-activation

A "default action" is a task the browser performs by "default" when it is triggered by an event. A "default action" can be a) the dispatch of a new event, b) calling a browser function or a function on a DOM element, or c) both dispatching an event and calling a function. The browser functions triggered usually alters the state of the DOM directly or indirectly.

Note: The above definition is wide. For example, it includes both the task of dispatching the `dblclick` event and the task of changing the `.value` of an `<input>` element.

## Event cascades

"Default actions" can trigger new events and functions, and events and functions can activate each other. One (or more) events can trigger one (or more) other events and/or actions that in turn can trigger yet more events/actions. When events/functions trigger each other in this domino effect, we call it **event cascades**. Event cascades can be:
* short: `event A => event B`, 
* long: `event A => function B => function C => event D => ... => function Z`, 
* possibly infinite loops: `event A => function B => event A => function B => ...`.

Each "default action" serves as a choice-point in the event cascades, and these choice-points can have one or more of the below characteristics at the same time:
* State-based: a default action can preserve state about *both* a) previous events, b) the state of the DOM during those previous events, or c) the state of previous sessions (cf. browsing history). When the default action uses state to make a decision about which action to perform and/or how to perform this action, the default action is controlled by a state-machine.    
* Syntetic: `(event A1 && event A2) || event B => event C`, which serves to group trigger events.
* Analytic: `if (condition) event A1 => event B`, which serves to filter out trigger events. If the condition is simply `true`, it can still be considered analytic (simply by renaming the triggering event).   

## `preventable` default actions vs. `cancellable` events.

A `cancellable` event is an event with one (or more) `preventable` default actions. If you call `.preventDefault()` on such an event, its `preventable` default actions will not be triggered.

Many default actions are preventable. For example, the default action function that: 
1. navigate to a new page when you `click` on a link can be blocked by calling `preventDefault()` on the preceding `click` event, and 
2. shows a native context menu when you right-click on an element can be blocked by calling `.preventDefault()` on the preceding `contextmenu` event. 

However, some default actions are *unpreventable*. For example, the default action function that:
1. creates `dblclick` events from `click` events *cannot* be stopped by calling `preventDefault()` on the preceding `click` event, and
2. creates `contextmenu` event from `mousedown` event *cannot* be stopped by calling `preventDefault()` on the preceding `mousedown` event. 
   
To conclude: Events are `cancellable`; default actions are `preventable`. If you can call `.preventDefault()` on an event, the choice-point function (ie. default action) that makes the next cascading event and/or function, will a) stop itself from running if it is `preventable` or ) run anyway if it is *not* `preventable`.

> `preventable` is presented as a programmatic construct, while it is nothing called `preventable` in the browser (to date). However, in later chapters we will implement this construct programmatically, and thus we present the concept here as if it already exists. 
     
## Default actions are owned by `HTMLElement`s, not `Events`(!)

*All* default actions are "owned" by (organized under) an `HTMLElement` type, the `Document` type or the `Window` type. Default actions are never universal for all DOM nodes. Default actions are brought into the DOM via HTML element types.Really? Yes, really! And here is why.

1. The `reset` event is associated with the `HTMLFormElement`. The `reset` event is dispatched just before the `HTMLFormElement` resets its values, and if you call `.preventDefault()` on the `reset` event, the form will not reset its values anyway. There is no point in having a `reset` event if there is no `HTMLFormElement`. And when you design, implement, maintain, use, and organize the `reset` and `HTMLFormElement`, it is useful to consider the `reset` event as something owned and controlled by the `HTMLFormElement`.

2. The default action of link-click-navigation only reacts when a user `click` on an `HTMLAnchorElement`/`<a href>` element.

3. The function that dispatches the `resize` event are linked to the DOM node that defines the viewport size: `Window`.

4. The `dblclick` and `contextmenu` functions are associated with the `HTMLElement` type, but not other DOM node types such as textnodes nor documents. This essentially mean that: yes, *all* `elements` in the DOM can create a `dblclick` or `contextmenu` when `click`ed, but no, there are still `EventTarget` nodes such as `window`, `document`, and `shadowRoot` that doesn't have this default action. Now, if you think of only elements as `EventTarget`s, then the functions controlling `dblclick` and `contextmenu` could be viewed as universal for all `click` events. But, as this is not the case, they are not.

    For example `dblclick` and `contextmenu` can be considered an action that all elements implement: two default actions associated with the `HTMLElement` interface. Other default actions are narrower: `click` that triggers a `<details>` element to open which in turn triggers a `toggle` event to be dispatched is only associated with the `<details><summary>` element pair.

5. Some default actions such as `draggable` apply to all `HTMLElements`, but can be assigned/removed using either HTML attributes such as `draggable=true` or CSS properties such as `touch-action: none`. 

When you add a new, reusable web component, you should consider what type of default actions it requires. If the elements behavior should be assignable to other element types as well, you should set it up as a default action applicable to all elements (cf. drag), and if the default action is particular to one type of element, you should set it up as a default action only for that element.

> Note. It is major architectural decision to associate *all* cascading default actions with elements and *not* with its trigger event. And it will require some serious consideration about how to resolve conflicts that arise when different multiple actions are associated with different elements that all reside in the propagation path of the triggering event.      

## Default actions are queued as tasks in the event loop 

Not as event listeners during event propagation! Default actions should not run *in between the event listeners* of one event, default actions should happen as a separate event loop task. 

Even though they are "owned by an element type", "default actions" are not triggered during normal event propagation. In fact, the browser evaluate which default actions should be run *before* the trigger event propagates, it then lets the trigger event propagate, and then *after* the event has finished propagation it executes any `preventable` task. The notable exception here is the default action that change the `value` on `<input type="checkbox">` elements: here, the task of changing the `value` property is done *before* the `click` event propagates, and is then undone if `.preventDefault()` is called on the triggering `click` event afterwards.   

There are two models in which we can view this: 

### Principle model for default actions 

The first model is the native and principle one. This model provides a point of execution that we can call `postPropagationCallback`. When an event has finished execution, the `postPropagationCallback` is triggered. The `postPropagationCallback` then evaluates the event to find out which default action(s) should be triggered by it.

```
prop(event A) => postEval(event A) => prop(event B) => postEval(event B) => run(function C)
    ↓    ↑                               ↓    ↑
  cap    bub                           cap    bub         
    ↳tar ⮥                               ↳tar ⮥ 
```

### JS model for default actions 

The second model is the JS model. In JS, we do not have access to a `postPropagationCallback`. In JS, we can only safely assume to evaluate an even at the beginning of event propagation (as event propagation can be blocked at any point using `stopImmediatePropagation()`). We therefore need to both evaluate the event to identify any default actions *and* queue the default action task in the event loop *up front*, and stop some of these default actions from being run if `.preventDefault()` has been called on the event during propagation. 
   
```
          ↱--------- queue B ---------↴    ↱--------- queue C ---------↴ 
eval(event A) =>  prop(event A)     eval(event B)=> prop(event B)     run(function C)
                     ↓    ↑                           ↓    ↑
                   cap    bub                       cap    bub         
                     ↳tar ⮥                           ↳tar ⮥ 
```

## Singular `preventable`, multiple `unpreventable` default actions

**Only one `preventable`** default action can run *per* trigger event. `preventable` default actions exclude each other.
 
**Multiple `unpreventable`** default actions can be triggered by the same event. Multiple unpreventable default actions can run in parallel, but queued one-by-one in the event loop, after a single trigger event.
 
Both **one `preventable`** and **multiple `unpreventable`** default actions for the same trigger event. For example, a `click` event can trigger *both* the `unpreventable` task of dispatching a `dblclick` event and the `preventable` task of dispatching a `reset` event.

```
        ↱--------------------- queue dblclick ------------------↴
        ↱----- queue reset -------↴                                   
eval(click) =>  prop(click)     eval(reset)=> prop(reset)      run(dblclick)
                   ↓    ↑                       ↓    ↑
                 cap    bub                   cap    bub         
                   ↳tar ⮥                       ↳tar ⮥ 
```

## Default actions are DOM generic and reusable

All default actions are generic. They may gather and react to contextual information, but they always react in the same way to the same DOM context. They are inteded to be reusable.

And this is the purpose of having default actions *in addition to* common event listeners: if an element should behave in the same way to an event in all DOMs, then this should be modelled as a default action, not a regular event listener.

## References

 * dunno