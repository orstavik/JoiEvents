# Async vs. sync events

The browser divides events into sync and async events. This has the following meaning:

 * Sync events are dispatched immediately and any a) event controller, b) event listener, and c) default action associated with them will run **in the same microtask**. All events that are initiated from script such as `dispatchEvent()`, `.reset()`, `.checkValidity()`, and `.requestSubmit()` are sync. The exception being `load`, `error`, and `toggle`. In addition are some events that are indirectly triggered by other externally driven events such as `focus` events sync.   
 * Async events are queued in the event loop as and all a) event controllers, b) event listeners, and c) default action associated with them will run **as separate macrotasks**. Note that event event listeners are separated as individual macrotasks. Most events that externally driven and dispatched by the browser are async: `mousedown`, `resize`, `click`, etc..
 
Full list of sync and async events.

## Why and when to run events sync?

To run several functions as part of the same microtask is faster than queuing and executing them as individual macrotasks. So, if there are no need to separate the different functions as different tasks, then running an event sync is your best bet. But. When is that?

Tasks is a means to separate different problems into different domains. If one problem area can be viewed as one, manageable unit that is to be solved by one developer in one design-time session, then this problem can be understood as belonging to the same task, as being one coherent sequence of actions. If that is the case with an event, that all the functions that react to this event is part of the same coherent sequence of actions, then it is assumed that the developer will be able to keep overview of any microtasks being delayed to the end of this atomic sequence. Put simply, if the event will address only one problem that one guy solve in one place, then that event can be viewed as manageable within the scope of the same microtask and thus the event marking that state change can be sync.   

## Why and when to run events async?

But, when is this not the case? When does an event mark a sequence of actions that is plural, and not unary?

An event that triggers different functions written in different design-time contexts is such an event. When a problem needs to be addressed by more than one guy, one place in the code, or in a more complex sequence, then these different reactions to the event needs to be separated from each other so not to cause confusion. This is described in detail in why macro micro tasks.

## Rules of thumb for async borders in event processing:

1. Event controllers should be run as if they were async. Each event controller demarcate an isolated task, that only interact with an isolated, "owned" property in the DOM.
 
    Many event controllers do not need/spawn microtasks, and these event controllers can of course be run equally well as either a prelude to a sync event or async event alike.

2. Default actions are also, by definition, written from another context in the DOM than the event listeners are written in. Default actions should therefor also always be run async.

   There are some instances when the browser runs the default action as a sync function on the tail end of the propagation of a sync event: `requestSubmit()`. This behavior is problematic as the microtask of previous statements or subsequent statements of the method calling `requestSubmit()`.
   
3. Event listeners that run within the same DOM scope, ie. either within a web component or the main document, can run sync. It is assumed that the complexity of envisaging microtasks being run after all event listeners (for the same developer within the same session) is not so complex as to require separating       

```

``` 

     
## References

 * 