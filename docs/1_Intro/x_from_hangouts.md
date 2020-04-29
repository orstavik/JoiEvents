# Event processing

When an event is dispatched, three processes are run on it:
1. event controllers.
2. event propagation.
3. default action.

Natively, these functions are run in the order above. Natively, event controllers only run for async events.

Custom, we can but should not run event controllers on sync events. Event controllers should be restricted to `composed: true` events that are run async. If event controllers are run on sync events, they should not spawn any microtasks nor should they dispatch any events, as these events' may have subsequent event listeners that may spawn microtasks. If they do, the damage will be a DOM with mutations interwoven into it from different developer contexts. It's not good, but it's not the end of the world.
 
When implementing custom default actions, they need to be implemented as it is not possible to create custom postPropagationCallbacks. For custom default actions, a custom event controller is added whose sole purpose is to call addDefaultAction(cb, element) on the event if there are any custom default actions that should be added to that element. The custom flow of control therefore looks like this in JS:

```
--the event macrotask (if any, it should have)
1. event controllers
   * event controllers that check for and add default actions to the event
2. event propagation
--new macro task
   *  
```  

((picture of the flow of events in ))

Events that are async dispatched can have event controllers and defaultActions. Events that are dispatched sync should avoid having event controllers and defaultActions. It will make the flow very complex. And their lack of macrotask setup makes it not suitable for defaultActions nor controllers, as they do not allow for microtasks between the different levels. Lack of microtask separation should not be extended above composed :false event listeners.

All `composed: true` events should be dispatched async. These events might transgress different DOM contexts, and they are likely targets for event controllers who may implement universal actions across such DOM contexts.

Sync event dispatch should be exclusive to composed: false events. On such events, there shouldn't be any defaultActions nor event controllers added.
Sync events vs async events. This is a more important and universal feature than i thought first.

# WhatIs: async and sync events?

All event controllers run before the defaultAction. They all change their state sync. But they may dispatch their event async (dblclick) or sync(focus).
This means that the state is updated when the defaultAction runs. And it means that their event sometimes will run before the defaultAction (such as focus) and sometimes after (dblclick).
The defaultAction is already queued when the EventController runs. So, we have event propagation, universal event controllers, default action. But. This means that we need to queue event controllers and defaultActions differently. For each event.
But, how will this work in practice? This means the methods that call the toggleTick needs to sort which method gets called when. And, we need to add a method addEventController next to addDefaultAction. And then the two methods needs to implement their own queue. Hm.. It is not so nice, but I don't see a way round it now..
When we addDefaultAction / addEventControllerTask, then we are queueing a new ToggleTick. All toggleTick do the same, they run the first event controller, and then the defaultAction. That way, they can be added any time you want. The event also needs a blockEvent() method. This calls StopImmediatePropagation, preventControllers, preventDefault.
When we addDefaultAction twice, we don't add a toggleTick since we only update the callback for the toggleTick. So, we do more inside the event object, but less inside the toggleTick. This should be fairly simple.
For event controllers, a lot of the filtering happens before the task is added to the event. The focus will check which key is pressed, and then only add a task for tab. The double click will filter the frequency of the clicks, and then only add a dispatch when the clicks are on the same target and fast enough.

We have an event controller listener and an event controller task. A defaultAction listener and a defaultAction task. The two listeners must always be added first to prevent developer domain event listeners from torpedoing them with StopPropagation. And then they queue then using addDefaultActionTask and addEventControllerTask on the event object. And then the event object adds the needed number of separate toggleTicks, but it manages which toggleTick run which controllerTask and defaultActionTask, so that the universal controller tasks run first, one per toggleTick, and the defaultActionTask last, one per toggleTick.
The EventControllerTasks should not run sync, ie more than one defaultAction task inside the same macrotask, because they might dispatch sync events like focus, and then these events' microtask will run as a group after all the event controllers has run as a group.
The defaultActionEarlyBird and the EventControllerEarlyBird and the DefaultActionTask and the EventControllerTask. Good distinction. And then add two methods to the Event prototype: addDefaultActionTask and addEventControllerTask. Which manages the queue inside itself. And this means that raceEvents is not necessary to pass into the Event methods, because they will always need it. The EventControllerTask will always need to race the defaultAction.. Which means that it might need to call preventDefault by default? Hm.. This is trouble. Ok. This needs to be a warning. EventControllers will run after the native defaultAction.
Also. I add an EarlyBird chapter for composed: false events. This earlybird function will add to the window capture for composed:true events, as we know, and add to the shadowRoot or window if composed true. This method therefor needs an element as additional input.
This will solve our loose end problem in the composed chapter.
Ok. With this plan, i get a new full structure suited to fix everything except running EventController tasks after event propagation, but before native defaultAction. We can do it where we have native event controllers dispatch their events sync, such as having a raceconditions on mousedown= focus or mouseup=contextmenu, but it is difficult on for example click which often have native defaultActions, but often do not have, or only sometimes in dblclick, has native event controller functions.
Event controllers are "universal actions". They can only change state that they are the only ones that can write to.
Also. Add a test for the universal action of marking clicked links as read when the click is preventDefault().



Async vs sync events. All events share the same Event interface, they are all the same type of simple data object. However, the browser has two different types of processing events: sync and async.
Async events are:
1. queued asynchronously in the event loop when they are dispatched.
2. Any native event controller task are run before the event propagates are run as if it were a macrotask (no lingering microtasks from native event controllers, even though no native event controller produce microtasks),
3. Run their event listeners (async) as individual macrotasks (so that any microtask triggered from within an event listener is run before the next event listener) and
4. Run their defaultAction (async) as its separate macrotasks (so that any microtask from an event listener is run before the defaultAction task).
I am in Chernivtsi
Now it is ok
Sync events are :
1. Run immediately within the current macrotask (which means that propagation will be nested if the sync event is dispatched during evemt propagation),
2. No native event had any associated event controller. If a custom event controller is associated with a native sync event, or a custom event, then this event controller's state changing action should itself try to avoid triggering a sync event)
3. The event listeners are called sync, which means that any microtask triggered from an eventListener will run after the event is finished processing AND along side and intervowen with the microtasks of the macrotask that initiated the topmost sync event). Thus, for event listeners for sync events, try to avoid state changes that might trigger microtasks (such as MutationObservers, attributeChangedCallback, and slotchange events).
4. The defaultAction are run sync. This means that the defaultAction might rum before microtasks from previously triggered event listeners has completed, which is not good). The natively dispatched sync events rarely has any default actions, but they can do so in (buggy) rare instances such as from requestSubmit.
5. The remainder of the macrotask that initiated the sync event dispatch.
6. The problem with sync events is that microtasks are run at this late stage. This means that sync events should preferably NOT have neither event controllers nor defaultAction, and any event listener on it should try to avoid triggering (all-but-insignificant) state changes via microtasks.
Any state change of 1. External state changes and 2. Internal state changes of the DOM should be composed :true events. Thus, submit is a change of the main document, and so if this evemt is triggered within a web component, it should be comoosed:true.
To show the problem of delayed microtasks:
1. Add an element with two attributes a and b.
2. Add a mutationobserver/attribute changed callback that says that property c = a+b.
3. In a sync event listener change the a attribute to a new number.
4. Illustrate how the c number remains unchanged in a later event listener for the sync event, and for later event listeners for the event propagation and in the macrotask triggering the event until the macrotask ends.
To add more complexity to this, try to nest two sync events one and two from inside an async click event.
Describe how to dispatch an event async (ie. How to pretend the event is triggered by a method dispatchEventAsync()).
First, the task that calls dispatchEvent must be added via toggleTick.
Second, the event controller cannot make microtasks during event propagation, so, there is a problem in how to make the event controllers run in their own macrotask.
Third, we do a shortcut and let the event propagation run sync. As this is too big an interference.
Fourth, we let the defaultAction run as its own macrotask.
No. Wait. We need to make the dispatchEvent task run as its own macrotask. So that we in the task queue on the event object have a toggleTick task for the controllers, propagation, and then the defaultAction. Yes. That is it. That way we can simulate event processing. But. The problem is that we need to run the EarlyBird event listeners for this type of event.. Unless we register these event controllers and defaultActions differently in a separate register, and then override dispatchEvent. But this would not work for natively dispatched events. For these events we would need to add earlybirds too..
We can do it, but at what cost.
I think that event controllers will run sync for sync events. I see no way round it.
This means that the sync dispatch is kinda a one way door. Once you go into this door, some opportunities gets closed.
EventControllers likely should not run within a sync dispatch context.. DefaultActions neither, although this miiight work. And, any event listener should not trigger microtasks.




I could make it smaller by describing the loading of the DOM as a load macro task. A big load macro task.
With one parser for the html different parser for dom
Different parser for innerHTML and one for the main document.




Blog. The problem is having event controllers that dispatch sync events before the propagation of the trigger event. Such as focus. Here, we will have two events propagate in the same macrotask. Not good.
It is no problem if there are no relevant microtasks, but that may very well be.
For events that the browser dispatches async, event controllers are no problem as each event listener had its own macrotask.
For events the browser dispatches sync, event controllers run as earlybirds will be more of a problem. Here, each controller will be run as a macrotask. There are three types of these evemts: focus (native automatic sync events), all dispatchEvent events, and requestSubmit.
Good morning)
To enable event controllers for these events, we could override the dispatchEvent and requestSubmit. These methods could then look for and dispatch the events async instead. However, this is bad.. Super invasive. Also, it wouldn't help focus events. Instead. Maybe implement a dispatchEventAsync method so that custom events could get custom event controllers. However this is likely totally unnecessary as you probably wouldn't need custom event controllers for custom events that also dispatched sync events.
Good morning)
We could add a fix for the requestSubmit method that would dispatch it async. A minor fix, which would be good.

Composed: true should be async, because they cross dom contexts. When they cross dom contexts, we need more assurance that they behave consistently. Focus events are the exception to this rule.. So. Is it so that when events bounce, we can make them sync? What are the native criteria for async/sync? And what should they be?
If reactions run to an event from different contexts, then it is necessary to have the microtasks queued from one dom context run before another reaction in another dom context.
This means that controllers, default action and propagation as a whole needs to run as a macrotask, and also event listeners from different contexts need to run as a part of different macrotasks.
This is what the original async events do.
If all the reactions run from within the same dom context, ie. the same developer make them all, then it can be considered manageable (though not beneficial for developer ergonomics), to have microtasks run after the event.
If events bounce, do so as separate macrotasks, then it is ok if the propagation within the different dom contexts are sync. Because that would fulfill the above criteria.
The benefit of sync propagation is speed.
By definition, event controllers provide their own, isolated context. They should therefore always run as macrotasks. However, if they don't trigger event dispatch or microtasks, then they can run as sync.
DefaultActions should by definition be considered written in another context (written in that of the shadowDom of the element it belongs to, but running in the lightdom im which the host node is used). DefaultActions that do not dispatch events or microtasks can run sync as a PostPropagationCallback. But if they trigger events or microtasks, then they should run async (to ensure that the event listeners are complete).
EventControllers is a means to isolate bindings to a restricted interface.
DefaultActions is a means to bind element to events across contexts.
Both event controllers and defaultActions are components. They are macrotask units in the event loop.
Event controllers is a simple component module to conceive of. It listens to events before the event begins propagation. It can have its own state. It can own properties in the dom only it can change (cf. activeElement and css pseudo-classes), no one else can write to these properties, but they can be read by others. And it can dispatch other events, both sync and async.
And it runs as its own macrotask. (it can run sync too, but then it cannot spawn microtasks nor dispatch sync events, as these microtasks and the sync event listeners will run inside the same macrotask as the event controller, which would be messy).
Event controllers run completely independent of everything else, except that they can write to their own dom properties and they can queue asynv events in the event loop and run sync events (thus triggering other event listeners).
Event controllers have very few bindings. If any. They own some dom properties, but they are the only ones who can write to them. They put events into the event loop. And they dispatch sync events. They should be (function as independent) macrotasks (thus sync events should run at the end). They are very much their own islands.
DefaultActions are a bit more complex. First, they interact with each other in that only one can run per event instance. They do so using the nearest target wins (last action overwrite first action on the same target).
DefaultActions run after event propagation. They have no state; they are pure functions. They are tightly bound to an element type/or pair of elements; they cannot change properties randomly in the DOM, but they instead do call methods on the element. They are tightly bound to a type of trigger events. They do not listen to event sequences, because they should alter the state of their associated target element, not keep the state of event sequences themselves.
But. DefaultActions should also run as macrotasks. Which separate them in sequence from other modules.
The listener for trigger events for defaultActions do not need to be the same as the target of the defaultAction, but when they are not, they create an HelicopterParentChild relationship /binding between the element that the trigger event occurs on and the element the defaultAction targets.
DefaultActions are not really independent modules. They are appendix to an element, the target of the trigger event.. But you can choose whether or not to turn on/off a defaultAction. It is bound to the element, but the element is not bound to it.
The defaultAction creates a macrotask around the reaction, but it need not separate its own functions from that of the element.
Should events propagate down? Past elements wrapping a slot element? Difficult question, but the answer is no. Events shouldn't propagate down. If the webcomp really needs to catch the event during propagation, it should do so as a defaultAction. It could also do so as an eventListener on the host node, but that is not recommended because that will break the event listeners in the same dom contexts as the same macrotask.
Todo add to the chapter about bouncing that the event can propagate sync within each dom context, but as different macrotasks between each dom context, ie. for each time it bounces.
Todo add that isStopped need to be added in the bouncing event.
IsStopped should return the element and propagation phase of the stopped. Maybe even the event listener function that stopped it.
We get an idealized, narrower architecture:
1. Sync propagation for composed: false events for each dom context. There is no composed:true. There is no async propagation.
2. Never propagate down. Such (useless) listeners can be torpedoed in so many ways, and should be replaced by defaultAction or event controller.
3. Event controllers run before the propagation, always as their own macrotasks.
4. DefaultActions run after propagation, always as their own macrotask.
There are two concepts about the native event propagation structure that is off:
1. The composed: true instead of bounce structure.
2. The async vs sync dispatch. This should be a macrotask frame around each dispatch, and a macrotask frame around the defaultAction and around the event controllers that initiate microtasks/dispatchEvents.
We are lacking a runAsMacrotask(callback). The best thing we have is toggleTick / setTimeout.

What are the borders for reuseability of web components (and event components)?

Every context is marked by the scope of view of its author.

For elements and apps, we can think of this as the dom context.
For event controllers, this is the event sequence and the dom abstraction.
Functionality in all these contexts should run as individual macrotasks. No microtasks should cross between such contexts. As a developer, you should know that no other functionality written by somebody else you don't know can come in and alter the state between your normal scope and your microtasks. If so, your microtask is fully delayed as a macrotask. This means that mutationobserver and the element callbacks are kept away.
Sorry, not kept away, but run within the same scope.
The context of developer scope is also restricted to individual dom levels (lightdom for the app scripts, shadowDom for the web comps, owned dom properties /css pseudo-classes for event components). DefaultActions don't have their own state scope, but write their scope on top of an element they know.
I don't think there are any fixed borders we should know about. The scope is limited in state (dom access) and time (macrotask in the event loop).



```
eventControllers.define(event, controller)?
and then create an EventTarget.dispatchEventAsync(event)?

The eventControllers.define(event, controller) would simply add a map with the entries.
Then, when the EventTarget.dispatchEventAsync(event) is called, the event method would retrieve all the event controllers for the given name, 
create a list of toggleTick for all of them,
create a toggleTick for the event propagation (sync),
create a toggleTick for the defaultAction.

```

## References

 *  