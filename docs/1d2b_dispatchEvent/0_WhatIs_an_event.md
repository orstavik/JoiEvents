



## where to queue an event dispatch?

async vs sync event dispatch

async event dispatch is simply wrapping the `targetEl.dispatchEvent(new CustomEvent(...))` inside a `setTimeout()` or `toggleTick()`.


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


## Grouping state changes under the same event

In an app, there are many, many internal and external state changes. If a) all of these state changes were given their own set of future-tense and past-tense events and b) each one of these events were given its own name, then:
1. web apps would be very, very slow, because every time the DOM changed slightly, a whole series of event messages and event listeners would run,
2. web apps would be very, very difficult to make, because every time you did a small change, then this small change could potentially trigger a whole series of other changes you would need to know about,
3. there would be thousands of different event names, describing slightly different situations,
4. etc. etc.

Therefore:
1. **Many state changes have no event**. Many state changes simply occur in silence. If a script needs to react to changes of such states, the script must instead of query or poll a property or proxy as best it can.
2. **Related types of state changes are grouped**. One event *type* is used to announce multiple, more or less related state changes. For example, the `input` announces state changes of different, but related input elements such as `<select>`, `<input>`, and `<textarea>`.
3. **Many state changes added to one event instance**. Different state changes can be associated with the same event *instance*: *two* event listeners and a default action can all run for the same event instance, all three changing the state in a different way.

Some questions therefore arise:
1. Which state changes should be associated with their own events?
2. Which state changes should be given their own event type?
3. Which state changes should be grouped?

## Example: Which state changes to announce?

Events is primarily *one* way to coordinate and communicate between "components" in a web app. A module can be understood as a part of the system that are developed and managed independently. Thus, if your component is producing an output aimed at another component, then dispatching an event is the preferred medium for this output.

For example: you make a JS module for fetching data from a server. This JS module should be developed independently from the rest of your application. Fine, you set up the JS module to be able to connect to the database and you provide the outside of the module with a set of methods so they can query the server for data. But. You also want the JS module to be able to communicate state changes on the server to the rest of the application. The JS module represent the server in the web app client, and you want external state changes on the server to be announced in the app. To accomplish this, you set the JS module to poll the server for data, and then dispatch an event to the `window` node to make this state change accessible to the other components in your web app.

**No event**. Your JS module could decide that some of the state changes on the server are not that important. The module might need to know about this state internally only, the JS module might decide that user script only cares about this state change when they themselves actively query the server, or the JS module might use a timer to toggle/debounce several state changes before dispatching an event. In either case, just because the server state change, the JS module can still *deem the state change not worthy an event*.  

**Grouped event type**. Your JS module would also very likely deem different state changes not worthy of different event names. The JS module could for example decide on only dispatching a single type for all server state changes, or provide a variety of different names for different types of state changes. Here, my advice would be not to go too far in one or the other direction, but aim to comply with convention and anticipate future use-cases.    

**Grouped event instances**. Your JS module could toggle/debounce multiple state changes in time. But, to group different events in space, the JS module must be split up as a series of DOM nodes that would enable event listeners to listen for different changes on different nodes. For example:
```
<my-server>
  <my-server-group>
  <my-server-me>
</my-server>
```

Here, the same event type `my-server-update` could be dispatched on different nodes. and `bubble`. This means that a different event listener could be added for the `<my-server-me>` and `<my-server-group>`, while a third event listener on `<my-server>` would capture all.

Another, and more common form of grouping event in space, would be to do so in the content of the event message. Ie. add two data objects instead of one to the same event instance.

The main criteria here is that an external state change is being reflected from a component that is developed independently from other components.

## events from web components
 
But. This criteria is not complete. Many components in a modern web app are "web components". Between elements in the DOM, events are *only* used for communicating *up*: "attributes and properties down, events up".
 
Web components should therefore make events when their internal state change should be communicated to the lightDOM context in which they appear.

**No event**. Not all state changes are worthy an event. State changes in a web component can also be:
1. performed silently,
2. alter/add an attribute to the element, which if the lightDOM context really needs to observe can do so via a `MutationObserver`, or
3. alter/add a property which scripts in the lightDOM can query.

**Grouped event type**. 

In the DOM, events are used as a means for modules (cf. web components/elements) to communicate to their outside surrounding.

  

 One event *instance* is used to announce multiple, more or less related state changes. For example, the `input` announces state changes of different, but related input elements such as `<select>`, `<input>`, and `<textarea>`.
 
 And one event type announce potentially multiple state changes A set of more or less *related* state changes are announced by the same event instance and/or event name. 
2. **Related state changes are grouped**. One event instance can announce multiple state changes. And one event type announce potentially multiple state changes A set of more or less *related* state changes are announced by the same event instance and/or event name. 
 must simply be queried  
And, there are not existing events for all of them and there are not The DOM is surrounded by and filled with many, many state changes. Having one event per state change would simply overwhelm the app with messages and event names. So, when do we add an event?
 
1. Events are a means to communicate between both  is filled with lots of state changing actions, both internal and external. And although many of these state changes have their own events, not all   


## How and when to dispatch future-tense events?

It is often good practice to have *one type of future state changes* be exclusively associated with *one future-tense event*. The `submit` and `contextmenu` events are good examples of such behavior.

It is often bad practice to have *many different state changes** be associated with *the same future-tense event*. For example, the `click` and `touchmove` events both heralds a great many different state changing actions (`click` can open a `<details>` element, toggle a checkbox, or navigate to a new page; `touchmove` heralds both document scrolling, image zooming, dragging, and swiping).

The problem with grouping many different state changes under the same name, is that the functions listening for the event will have a hard time discovering which state change the event heralds. This leads to problems such as a) adding lots of boilerplate code that analyze the context of the event to discover which action it triggers. This in turn causes the  in turn can make the event listeners a) fill with boilerplate code which does this identification, b) lead to errors when a different action is triggered in different edge cases, and therefore the wrong state change is stopped when `.preventDefault()` is called on the `click` event.

However, there are tons of state changing actions in a web app. And if we dispatched a new event and gave that event its own name for each of these state changes, then we would a) have lots of events flying around in the app and b) have a bewildering array of different event names. That would be bad practice. So, not all individual state changes can be heralded by their own event, and not all different types of state changes can be given their own name.   



Striking the balance between `submit` and `click` can be tricky. On the one hand, if every action gets its own heralding event, then the event namespace would quickly swamp and overwhelm the developer. On the other hand, if all actions are heralded under the same (event) name, then knowing what event is which action when can be very confusing.

A native example of a compromise is the `beforeinput` event. The `beforeinput` event announces one of a) a series of a similar, but not identical state changing actions on b) a series of related, but still different elements: `<input>`, `<select>`, and `<textarea>`. The `beforeinput` compromise works, and we can see why when it to `click`:

1. The state changing actions of the `beforeinput` event are quite similar. In many use-cases you would perform the same action if the `before-state-change` event were dispatched on a `<textarea>` or an `<input type="radio">`. This is a benefit for `beforeinput`: it both reduces the number of event names developers need to remember, and it provides a useful common hook to react to similar use-cases from. (To put it in reverse, if `beforeinput` event were broken into different types depending on what type of input element were changed, then most often you would simply add multiple event listeners for all these types in places were you today only have one `beforeinput` event listener.) 

   This is not the case for `click`. A `click` listener which would catch `click`s from different elements that react to `click` would likely need to process which element triggered the `click`. Thus, a "catch-high" strategy works poorly for `click`, while often works fine for `beforeinput`. There is little benefit of the umbrella name.    

2. The state changing action of the `beforeinput` event is directly discernible by looking only at the `target` of the event. This makes it simple to split or filter the `beforeinput` event simply using an `if (e.target instanceof HTMLSelectElement) {...}`. This makes the cost of clustering many similar state changes under the same name low.
 
   This is not the case with `click`. The state changing action of a `click` event might be associated with an ancestor of the `target`. To discover which state changing action a `click` induces therefore require a more complex algorithm, which costs more, both in performance and in developer complexity.
                        
## Future-tense, past-tense, or both?

Some state changing actions are both preceded by a future-tense event and 

If you add a state changing reaction to an event, either as an event listener (or as a default action in a web component), then you should strongly consider heralding this state change with its own, future-tense event type (cf. `submit` and `contextmenu`). An extremely diligent, event-oriented developer would likely desire to herald all state changes with their own event.
 
 Similarly, you should try to avoid adding a state change directly to an existing event, without adding a preceding event to distinguish it (cf. `click`). If you have many similar state changing actions that you consider giving an umbrella name, do so primarily if the action can be discerned from the trigger event's `target` directly (cf. `beforeinput`).
    
## References

 * 