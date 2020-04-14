# WhatIs: Async/sync events?

The browser divides events into sync and async events:

## WhatIs: sync events

Sync events are:
1. dispatched immediately, and
2. cause **all event controllers, event listeners, and any default action** associated with them to be **run within the same microtask**.

```
--sync event--------------------------
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  |                        |  |  |
|  |  | controller 1           |  |  |
|  |  | controller 2           |  |  |
|  |  | listener   1           |  |  |
|  |  | listener   2           |  |  |
|  |  | listener   3           |  |  |
|  |  | default action         |  |  |
|  |  | controller 1 -> micro  |  |  |
|  |  | listener 2   -> micro  |  |  |
|  |  |                        |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  |                        |  |  |
|  |  | delayed action from    |  |  |
|  |  |   controller 1         |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  |                        |  |  |
|  |  | delayed action from    |  |  |
|  |  |   listener 2           |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
--------------------------------------
``` 

Almost all events initiated from JS script are sync: 
 * `dispatchEvent(syncEvent)`. 
 * alling `.reset()` and `.requestSubmit()` on a `<form>` trigger sync `reset` and `submit` events. 
 * `.checkValidity()` on an input element can trigger sync `invalid`.
 * `.play()` on an `<video>` element trigger sync `play` event. (todo verify)

The exception to this rule is the async `toggle`, `load`, and `error` events.
 
In addition, a few other events indirectly trigger other async events:
 * `animationend` and the other animation events initiated by the browser.    
 * `focusin`, `focusout`, `focus`, and `blur` events triggered indirectly from the async, UIEvents `mousedown` and `keypress` (`.focus()` triggers no `focus` events).    

## WhatIs: async events

Async events are:
1. queued in the event loop and
2. cause **all event controller functions, event listener functions, and the default action function** associated with it to be **run as separate macrotasks**. 

```
--async event-------------------------
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | controller 1           |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | delayed action from    |  |  |
|  |  |   controller 1         |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | controller 2           |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | listener 1             |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | listener 2             |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | delayed action from    |  |  |
|  |  |   listener 2           |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
|                                    |
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | listener 3             |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
|                                    |
|                                    |
|  --macro task--------------------  | 
|  |                              |  |
|  |  --micro task--------------  |  |
|  |  | default action         |  |  |
|  |  --------------------------  |  |
|  |                              |  |
|  --------------------------------  |
--------------------------------------
``` 

> Note: even event listeners are separated as individual macrotasks. 

Most events that are "externally" initiated are async:
 * User initiated events such as `mousedown`, `resize`, `click`.
 * Browser/OS initiated events such as `offline` and `resize`.

Events that are triggered by DOM and script parsing are async:
 * the `load` and `error` events triggered by loading a script or stylesheet are async.
  
The `toggle` is a special case. It is async both when it is initiated by script toggling the `.open` property on `<details>` elements and user `click`ing on the `<summary>` element.
 
Full list of sync and async events.

## Why: sync and async events?

It is *faster* to run multiple functions as part of the same microtask than queuing and executing them as individual macrotasks. So, if there is no reason to queue and run the reactive functions associated with an event (ie. event controllers, event listeners, and default action) async, then we want to dispatch events sync.

When a state change should cause reactions that can be solved within a single scope: ie. by one guy working on code in one place, then the event that unites the state change with its reactions can be modelled as one coherent sequence, one unary task. This means essentially that it is believed that the developer will manage the complexity of envisaging all these functions in one go. It is also assumed that the developer will manage the complexity of microtasks being delayed past event listener function borders (likely correct), and between event controllers, event propagation, and default action (likely incorrect). 

The question then remains: when do we need to run reactive functions as separate (macro)tasks? When does an event mark a sequence of reactions that is plural and diversified, and not unary and atomic?

Tasks separate groups of reactions into isolated sequences of actions. This is easily accomplished when the reactions can all be described by one guy, in one place, and in one universal sequence. But, when:
1. the group of reactions is so big and diverse that it becomes unmanageable in a single place,
2. which of the reactions needs to be called upon varies from time to time (no universal sequence), or when
3. more than one person develops the reactions,

then the single unary/atomic task splinters into several, separate, diverse tasks. These diverse and dispersed tasks may overlap differently in different contexts, which require a clear agreement about when and how the flow of control should pass from one to the other, as they all subtly change the state of a shared underlying state model: the DOM. This clear agreement is simply: 
 * a task in any sequence of actions that is unary and atomic (set of reactions that can be written by one guy, in one place, with a fixed order).
 * guy/place #1 controls task #1, and guy/place #2 controls task #2.
 * task #1 runs first, and only when task #1 is finished does task #2 run.

The task border is the context of the code design-time, which in turn is a reflection of the required needs run-time. Recurring tasks are given similar boundaries, so as to ease *reuse*.

## Rules of thumb for async borders in event processing:

From this more abstract foundation, we can distill some rules of thumb:

**Event controllers** are by definition unary, atomic sequences of reactions to an event. They run at fixed times. They only change properties(places) in the DOM that they "own", and so can be written in one place, separated from other code contexts. Event controllers *are* tasks.
 
As a clearly demarcated task, event controllers should not interweave with other tasks. This means that before an event controller passes the control of the flow to another event controller or to the process of event propagation, all the state changes of the event controller should be finished. This means one of two things:

Event controllers: 
 * should run async as their own macrotask, or
 * can run sync *before* the first regular event listener function as long as the event controller does *not* a) spawn any new microtasks or b) dispatch inner events which also might spawn microtasks (such as for example `focus` event controller does when it spawns `focus` events).

**Default actions** are written from a within-the-element context (a shadowDOM perspective), while any event listeners that precedes it should be written from a group-of-elements context (a lightDOM perspective). This means that default actions are written in a different place and most likely by a different guy than the event listeners preceding it. Therefore:

Default actions should: 
 * run async as their own task,
 * always run after the microtasks of the preceding event listeners are completed, and
 * not interweave with the preceding tasks of event listeners or any subsequent tasks.   

> Note: the browser is known to run default actions sync, ie. not ensuring that microtasks spawned by preceding event listeners are completed before it starts: `requestSubmit()`. More on this problematic behavior later.
   
**Event listeners** that run within the same (light) DOM scope can run sync. It is assumed that the complexity of envisaging microtasks being run after all event listeners (for the same developer within the same session) is not so complex as to require separation into several tasks. However, when an event triggers event listeners in different DOM contexts, ie. `composed: true` events propagating past shadowDOM borders, then it would clearly be beneficial that different tasks were allocated to event listeners in different contexts: ie. that microtasks spawned from event listeners in one DOM context are completed before other event listeners in other DOM contexts are triggered.
 
However, it should be noted here that when using default actions, the need to add event listeners in different DOM contexts to the same event *greatly* diminishes. Also, with `composed: false` events or events that `bounce`, then no same event will cross shadowDOM borders.

     
## References

 * 