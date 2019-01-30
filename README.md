# JoiEvents
 *compose events like a native!*

## Vocabulary

In this project/book, we use the following definitions.

 * **event**: something happening in the browser. DOM Events being dispatched is an event, of course,
   but a callback triggered or native system task executed are also generally speaking an event.
 * **DOM Event**: an event that is triggered by one or more other events. Some native system tasks
   such as browser navigation, (cf. defaultAction or native behavior) can often be considered an
   invisible DOM Event.
 * **Composed event**: a DOM Event that is triggered by one or more other DOM Events.
 * **Triggering event**: a DOM Event that will initiate the dispatch a new composed event.
 * **Atomic event**: a DOM event that is not triggered by any other DOM events.
 * **Event sequence**: a series of triggering events that when following a specific order 
   will dispatch a composed event.
 * **Preceding event**: a DOM Event that propagates before another DOM Event.
 * **Trailing event**: a DOM Event that propagates after another DOM Event.
 * **Event Triggering function**: a (set of) functions that capture DOM events and dispatch composed events.
   The triggering function is at the very start of a triggering event's propagation: 
   added a) globally (ie. to `window`) and b) in the capture phase of the propagation.
 * **Native events**: DOM Events created by the browser.
 * **Custom events**: DOM Events created by a script.
 * **Global events**: DOM Events that can apply to HTML elements in the entire DOM.

## Personal comment
I was surprised to find how rarely EventToEventComposition is used. 
It made me second guess my self.
And, while I pursued these second guesses, I became even more surprised. 

Firstly, many native events follow the EventToEventComposition pattern. 
Through its actions, the platform implicitly, but still quite strongly, advocates using this pattern. 

Second, pursuing this pattern reveals several flaws in other approaches and several large benefits 
for EventToEventComposition: 
 * extreme ease of reuse, both across apps and within apps; 
 * extremely low coupling to other parts of the code;
 * super clear interfaces yielding less confusion, misuse and general anxiety;
 * and lightDOM composeability, ie. you can combine events from the same vantage point as you can native elements. 

Yet, for some reason, almost no one uses this approach! Why is that? 
I really don't know. ¯\\\_(ツ)\_/¯

