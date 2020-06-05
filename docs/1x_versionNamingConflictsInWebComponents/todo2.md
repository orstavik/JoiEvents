The problem of version/naming conflict is the biggest issue with composed true events. If the events are non composed and run on the host node, then even though two technically different events with the same name can be dispatched from different (host) nodes in a lightDOM, then there will be very few conflicts of event version/name.
And, the need to grab the event trigger is only really necessary for composed true events. If events bounce, the individual dom context could likely control this order.
There should be a separate method on bouncing events called preventBounce(). This is the bouncing alternative to the grab function for composed true events.
Yeah. StopPropagation(), preventDefault(), stopBouncing() are three separate functions. StopBouncing() is called whenever an event controller in a dom renames/replaces/hides a different event. Like mousemove => drag.

The stopBouncing could also simply be a "rename" / mutate function for the bouncing trigger event. This is essentially what happens.. That means that the existing bouncing function could be reused.
With bouncing events there would very rarely be any conflicts between different modules/web comps. The only conflict would be HelicopterParentChild child -> parent. And slotted event listener.
The conflicts here are:
1. missing events in event sequences (you get the start, but not the end event, or you don't get the start, only the move event, etc.).
2. You get the wrong data on the event, most likely the wrong property name, or the wrong property value.
3. You get the wrong name on the event.
4. You miss a relatedTarget.
These problems should be convention based. If you break these conventions, you need to override the event controller. Thus. If there is a controller for a name, then the top controller should be used? Or the lower? This is specified when you register the controller. It should by default be top down, but you could specify a hard boundary.

----

The situations for conflict is the starting point.
1. Different elements in the same dom. This is easy to manage, just make sure you load the correct files. The context of use assigns code to elements.
2. Sub Elements inside different shadowDoms. This is a smaller problem, only efficiency, not functionality. Use your own tag names, or scoped customElements per shadowDom.
3. Event controllers. If events bounced instead of composed, then this wouldn't be a problem neither. Event controllers could run on a per dom concept. For example, dblclick controllerw wouldn't need to bounce. Click wouldn't need to bounce. You would just add them implicitly to the shadowRoot when an event listener was added. Hm.. This i can do for all event controllers, no? If you add an event listener for a composed event, then the system installs it? If you don't add an event listener, then you don't install it?
Hm.. I need to check this out.
4. Between sibling elements. HelicopterParentChild. Here, check for ability, not type nor tag name.
And then it is the question about :slotted styling. And :shadow parts. And css variables. Shadow parts and css variables go top down, one level. So they are not a problem. :slotted is a problem if you assume too much about the element slotted in. But this can be done on a per ability method, not a type or tagname method.
Hm.. Elements adopted is not a concern. I don't see the clear usecase for this. Slotting is what adopting should be. Hm.. Maybe AdoptedCallback should throw an error?? To simply turn it off.
This is causing huge headaches. And it is not really necessary? Why move an element from one dom context to another?
The only need for conflict resolution is efficiency. Use one common version for many tag names. This should be kind of forced top down. The customElements.define should state that the following version is capturing all other definitions of a certain name and range. Altering the shadowRoot of that element.
Hm.. This is kinda hard as events are created from .innerhtml.
https://github.com/w3c/webcomponents/issues/512
Why adoptedCallback is bad. When elements are moved, so are all their settings. As an event target, the element has a set of registered event listeners. But, there is a bug with events, they are not only relevant for the element, but also the document. The composed should be bouncing. This means that every time an element is disconnected, it should remove the event listeners for defaultActions.
When elements are adopted, then their event listeners should be reset. In this instance, there is not much difference between a connectedCallback and adoptedCallback. Every action that require a document context, ie. Adding/removing event listeners, should happen at connectedCallback/adoptedCallback. Is adoptedCallback called in adition to connectedCallback, or only in place of it?
All event listeners should be added during connectedCallback /disconnectedCallback, i must check if the old root is available during disconnectedCallback!
And then we can add/remove event controllers implicitly, upon need, in all roots.
The problem of adoptedCallback is different. This is more principled. State data shouldn't be transported between dom contexts as elements. Js data at most. Pure.
Two restrictions :
1. addEventlistener should only be allowed when element is connected.
2. AdoptedCallback is conceptually bad and shouldn't be allowed. Antipattern.
Controling events from add event listeners is for two reasons: 1. it enables sparse bouncing. You don't need to dispatch an event in a dom that doesn't have listeners, while at the same time, you will get the event in all the doms that need it. Demo is comp a, b, c where only a and c has dblclick listeners. 2. It can resolve conflicts where the same event listener is added multiple times. As each dom now controls its own listeners, then it is no longer a problem if slightly different events with the same name are generated differently in different dom contexts. As long as they work coherently within their own context, as these event controllers now can run only non-composed events, they are now safe from conflicts.
I should make a my-tripleclick event. That will listen for my-dblclick. That will listen for my-click. That will listen for mousdown/up. All these 3 event controllers will be registered. When the listener comes, they are queried by event name from the customEvents.define register. They only produce non-composed events.
This is definitely the method to make event controllers. Web events?
Web events is a good name. As a double for web components. You have web components and web events. But. Looking ahead for scoped customElements, they should be added to the shadowRoot and window prototype. We need a method on the noncomposed event root.
If the web event/event controllers are no longer conflictable, but locked to individual doms, then there is one less conflict to solve.
It will be really cool. You drop in a file, and then you can just listen for that event. And it will be super efficient.
Grabbing an event that bounces, simply means stopping it from bouncing AND propagating. Grabbing a composed event is far more difficult.