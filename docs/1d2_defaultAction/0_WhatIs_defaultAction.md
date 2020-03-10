# WhatIs: "default action"

> https://www.w3.org/TR/uievents/#event-flow-activation

1. A "default action" can be a) the dispatch of a new event or b) performing another function in the browser (commonly a function that alters the state of the DOM directly or indirectly via performing a function in the browser). This is a wide definition! Both the dispatch of the `dblclick` event and changing the `.value` of an `<input>` element fits this criteria.

2. A "default action" can be activated by either one or more "trigger events" or one or more "trigger functions". This means that you can have: 
   * long cascading sequences: `event A => function B => function C => ... => event Z`, 
   * multiple events or functions that trigger another event: `event A1 + event A2 => event B`,  and 
   * potential infinite loops where `event A => function B => event A => ...`.
   
   Again, this is a wide definition: both the `dblclick` event and a function changing the `.value` of an `<input>` element would fit the criteria of a being a link in such chains of events/actions.
   
3. A "default action" can be *either* preventable or unpreventable. An event is `cancelable` when you can call `.preventDefault()` on that event and prevent a subsequent action or event from being called upon. We can say that an event or action is preventable/unpreventable when this event can/cannot be stopped when you call `.preventDefault()` on its trigger event. 
   * `dblclick` is "unpreventable": if you call `click.preventDefault()` you will not stop the ensuing `dblclick`; 
   * the `reset` event is preventable: if you call `click.preventDefault()` when a user has clicked on a `<button type="reset">`, then the `reset` event will be cancelled/not be dispatched; and
   * the function of showing a context menu is preventable: if you call `contextmenu.preventDefault()`, no context menu will be shown on screen.
   
> `cancellable` means that calling `preventDefault()` on the event will cancel a subsequent, cascading "default action".

> `preventable` means that a default action can be blocked by calling `preventDefault()` on its triggering event. 

4. *All* "default actions" are "owned" by a HTML element types. "Default actions" are brought into the DOM via HTML element types. Really? Yes, really! For example `dblclick` and `contextmenu` can be considered an action that all elements implement: two default actions associated with the `HTMLElement` interface. Other default actions are narrower: `click` that triggers a `<details>` element to open which in turn triggers a `toggle` event to be dispatched is only associated with the `<details><summary>` element pair.

> This is a little bombshell. It is major architectural decision to associate *all* cascading default actions with elements and *not* with its trigger event. And it will require some serious consideration about how to resolve conflicts that arise when different multiple actions are associated with different elements that all reside in the propagation path of the triggering event.      

5. Even though they are "owned by an element type", "default actions" are not triggered during normal event propagation. In fact, the browser evaluate which default actions should be run *before* the trigger event propagates, it then lets the trigger event propagate, and then *after* the event has finished propagation it executes any `preventable` task. The notable exception here is the default action that change the `value` on `<input type="checkbox">` elements: here, the task of changing the `value` property is done *before* the `click` event propagates, and is then undone if `.preventDefault()` is called on the triggering `click` event afterwards.   

   There are two models in which we can view this: The first model is the native and principle one. This model provides a point of execution that we can call `postPropagationCallback`. When an event has finished execution, the `postPropagationCallback` is triggered. The `postPropagationCallback` then evaluates the event to find out which default action(s) should be triggered by it.

```
prop(event A) => postEval(event A) => prop(event B) => postEval(event B) => run(function C)
    ↓    ↑                               ↓    ↑
  cap    bub                           cap    bub         
    ↳tar ⮥                               ↳tar ⮥ 
```

   The second model is the JS model. In JS, we do not have access to a `postPropagationCallback`. In JS, we can only safely assume to evaluate an even at the beginning of event propagation (as event propagation can be blocked at any point using `stopImmediatePropagation()`). We therefore need to both evaluate the event to identify any default actions *and* queue the default action task in the event loop *up front*, and stop some of these default actions from being run if `.preventDefault()` has been called on the event during propagation. 
   
```
          ↱--------- queue B ---------↴    ↱--------- queue C ---------↴ 
eval(event A) =>  prop(event A)     eval(event B)=> prop(event B)     run(function C)
                     ↓    ↑                           ↓    ↑
                   cap    bub                       cap    bub         
                     ↳tar ⮥                           ↳tar ⮥ 
```

6. *Only one preventable* default action can run for each trigger event. However, *multiple unpreventable* default actions can be run from one trigger event. This means that you can have multiple unpreventable default actions and one preventable default action for the same trigger event, such as both the unpreventable `dblclick` and the preventable `reset` being triggered by the same `click`.

```
          ↱--------------------------- queue C ---------------------------↴
          ↱--------- queue B ---------↴                                   
eval(event A) =>  prop(event A)     eval(event B)=> prop(event B)     run(function C)
                     ↓    ↑                           ↓    ↑
                   cap    bub                       cap    bub         
                     ↳tar ⮥                           ↳tar ⮥ 
```


7. All "default actions" are generic. They may gather and react to contextual information, but the algorithm of contextual reaction remain the same in all DOMs. They react to the DOM in the same way in all DOMs.   

## References

 * dunno