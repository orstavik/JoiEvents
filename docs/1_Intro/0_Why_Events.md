# Why: events?

**Events announce state changes**. When the browser, the environment around the browser, or an element in the DOM change state, then this state change can trigger an event.

## The purpose of events

Practically, in the browser, events serve a single purpose: they *indirectly* trigger other functions. But. Why do we need to trigger these functions *indirectly*? Why not just trigger them *directly*?

The main reason *a function in a component* needs to trigger *other functions in other components* indirectly is that the triggering function in the component does not know:
1. which other functions it should trigger,
2. the locations of the other functions,
3. the time when the other functions should be triggered, and
4. whether the functions (1), their location (2), or the timing of these function calls (3) will change in the future.

When all the four criteria above is known and fixed, then a component that observe/undergo a state change can call the other functions directly. But. If *one* of the above criteria is missing, then the component that observe/undergo a state change cannot call the other functions directly. When the component cannot safely trigger other functions directly, the component must announce the state change indirectly, via the **event system**.

Other functions that wish to react to state changes of unknown origin or timing, can then in turn *subscribe* to this from the event system. This is called "listening for a certain event `type`". Other functions can subscribe to this event any time, as the event system will control the timing of any future notification. 
 
The **event system** is a *singular function* whose a) location is fixed and that b) internally manages the timing of calls. And neither the location of or timing within the event system should ever change over time (although this cannot always be avoided). When alerted about a state change from one function, the event system then redirect this message to all the other functions that subscribe to messages of this type of state changes, and then call them in the specified order/time. In this way, the **event** system connects two or more functions that are otherwise are independent from each other to coordinate their actions around a specific state change.

> Component: a group of functions and data. Apps are split into components for two reasons:
>   1. the app is so complex and filled with so many details that a human developer is not able to wrap his/her head around it at one time, and 
>   2. so that similar pieces can be reused with as little effort as possible in many different apps.
>
> Components can therefore be developed independently: most often by the same developer, but at different times; but also by different developers in a team, possibly the same time.    

## WhatIs: up?
 
Events up! Attributes and properties down.

But. To understand this expression, you need some context. By "up", the expression means "upper DOM contexts", not elements higher positioned *within* the DOM context the function you are writing is located. We need an example:

Let's say you want to write 

in the 

In the DOM, which locations are known? The location of the events 



## References

 * 