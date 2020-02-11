# WhatIs: EventControllers' life cycle?

Most event controllers are simple. They are created and activated. That's it. Keypress controller is one example of such a controller. It will always register `keydown` and `keyup` events, and even though it registers the state of the event sequence, the event controller itself will never change which events it listens for.  

Other event controllers are more complex. They are:
1. created, then 
2. started into a active phase, then
3. changed into a second active phase where it starts to listen for new events and possibly stop listening for some or all of its first active phase events, then
4. activated into a third active phase where it grabs control of some events, or
5. maybe it is instead cancelled and placed in a hibernation phase where it listens for yet another set of events, before it is finally either,
6. stopped or put back into its first active phase.

The DragController is an example of such an event controller.

We can categorize the event listeners life cycle in these different phases:
1. constructed. The event controller object is created, but it listens for no trigger events.
2. Activated. The event controller object is registered to listen for one or more trigger events. There are several different types of activated stages:
   * Initial activation. This is the state the event controller is in when it is first connected or reset.
   * Secondary activation. There can be several different secondary activation states. These are states that the event controller is in when a trigger event has caused it to change state.
   * Grabbing state. When an event controller takes control and monopolize one or more trigger events in the system, we can say it is "grabbing" another event. The event controller listens for trigger events using a different mechanism in this state. Underlying trigger events should not be grabbed during initial activation. A grabbing phase should be a type of secondary phase.
   * Cancelled activation. When another event controller grabs control of the event, then it will cause other event controllers listening for the same triggers to enter a cancelled phase. Commonly, the cancel phase listens for a special callback/event that will alert it that its desired trigger events are free again, and then the controller will reset and flip back into its initial activated phase.  

```
-> constructed -> initial activation -> secondary activation 1
                                     -> secondary activation 2
                                     -> secondary activation 3 / grabbing
                                     -> secondary activation 4 / grabbing
                                         .... 
               <-                    <-

```

Event controllers change state only when one or more of their trigger events call them.

## References 