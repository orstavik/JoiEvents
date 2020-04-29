## Event listener = recipient function at an address

When an event "reaches" a `target` node, the text content of the event will be passed to all event listener functions *registered at that address*. This means that even though an event "letter" is dispatched by a single function, it will be read and responded to by a family of recipient functions.

## Event listeners at multiple addresses

A fun concept is that it is not only recipients at the end location that can read and respond to the event. When the event message is sent, it can also be read and reacted to by functions on nodes between the event and the `root` of its DOM world. It is like sending a letter in old East-Germany: other event listeners can open the letter on all the nodes the letter passes on its way to its `target`, and these event listeners on the nodes "on the way to the `target`" can read the content of the event, react to it, and even stop the letter from reaching its `target`.

###  

Event listeners are associated with different event `type`s.  

Events are not really letters. And the postal metaphor only takes us this far. Because a single event dispatched from a single function can reach and trigger multiple other listening functions.


Multiple functions (event listeners) can be added to the same address 

## WhatIs: Event `type`s

Event `type` is the class event instances belong to. This  
   
a. what is normal event flow. what is async event flow. events are dispatched async, sequential, one by one. the default actions are run sync.

this is what is the event cascade. the flow of one event, to another, to a default action, to a third event. one by one by one.

Worth noting is that 

1. Why dispatch an event?
what role does an event play in a web app? and what alternative means of communication do we have?
here, particularly, the alternative of attributes on web components, or js properties.

   2. when not to dispatch an event?

3. grouping. when to group certain changes under the same name, and why do we not give everybody their own name? 
   4. what consitute a relationship between state changes?  
       State changes can be related by:
       1. the element or external property that they they change, such as `input` events are.
       2. the trigger event type, such as `click`. 
       3. event semantics, such as `visibilitychange`.

4. why dispatch an event sync? or async? here is the nestedPropagation problem. The conclusion of the nestedPropagation problem is that we always want to dispatch the event as an async task from the event loop.

5. why perform the default action of an event async? That is the SyncDefaultAction problem. that should conclude in the fact that we always want the default action queued in the event loop, so that microtasks and other event listeners for the trigger event are run before the defaultAction runs. 

So, should SyncDefaultAction be moved into the defaultAvtion chpater?

5. when and how to dispatch a past tense event?

6. when and how to dispatch a future tense event?

# WhatIs: related state changes?

    
## References

 * 