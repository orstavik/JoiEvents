#HowTo: react to events in event components

You have two sets of events:

1. external (either window target events, or composed true events). Make sure that the `target` of the external event is relevant. This event must be intercepted as an EarlyBird. Do not call stopPropagation in an EarlyBird unless you intend to block the event for all contexts. And this should not likely be done by a web component, blocking an event for all contexts should likely only be done in the main, top-level lightDOM. 

   The reaction to these events, either if it is a dispatch of a future-tense notification, a state change, and/or a past-tense notification should be added as a defaultAction! Both such state changes and such cascade events should be queued in the event loop. As default actions. That can be prevented. or not. 

2. internal  (`composed: false`) events. They represent a state change in one of the internal elements. These events can safely be listened for inside the shadowDOM, but be aware of ComposedFalsePropagateDown problems if the target of these events are slotted into an internal web component. 

   They are quite simple. You can listen normally. State changes that happen inside the web component *can* sometimes be done sync. If the action is "finished" when you need to dispatch the event, then you can dispatch the event sync at the tail end of the action. This might be what you want, if you can make it so. But, if the action is not finished, ie. the action might be able to trigger other side-effects too later in its execution, then you must delay the event dispatch in the event loop as a toggleTick task so that you ensure that you events propagation does not nest into an ongoing state change.
   
   
```html


```
   
    