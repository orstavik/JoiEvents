# Pattern: EventSequence

Events can also produce other events:
 * A `dblclick` is made up of two `click`s in quick succession.
 * A `dragstart` is created when a certain `mousedown` is coupled with a certain `mousemove`.
 * todo add other examples.  

When *two* or more events produce *one* or more other events, the browser needs to observe parts of the event sequence to discover the pattern. This means that the browser needs to:
1. not only listen for more events, often of different types, but
2. also *store* information about the previous events.

The browser needs to store *state* information about the *sequence* of events that has occurred in *the current session*. 


## Event controller & state

Until now, our event controllers themselves have not preserved any internal state. And this sea-change needs our attention:
 
The FocusController remembered which element had focus between its triggering events. But. The FocusController relied on an external property in the DOM, the `document.activeElement`. Yes, the state of `document.activeElement` is essential to the FocusController, but the `document.activeElement` is not "hidden inside the event controller".

On the other hand, the `DblclickController` above has an internal, *hidden* state. No other part of the system has access to this state data, and the browser intends to hide this data and free the developer from ever knowing/caring about them.

There is a *dramatic* consequence that arise when event controllers start having state: it makes the need for us to modularize them 10x greater. To see this clearly, lets turn this statement on its head.
 
To have one, big GodEventController *could* be feasible if event controllers never had any internal state. If the event controller functions were essentially pure and produced the same set of outputs for their inputs, we can imagine having one function that listens for say `mouseup` and then inside that function run a series of if-then queries that essentially checked all the possibilities for `mouseup`. But, when some of the decisions for `mouseup` depends on previous events such as `mousedown` and/or `mousemove` and/or `focus` etc., then the *one GOD function per trigger event*-concept  becomes unmanageable. 

There are other reasons to that the GOD event controller is not a good idea. It doesn't scale. And it cannot be extended (how do you add an if-then check inside such a GOD controller?). But the state is the first thing that compels us to modularize our event controllers.


## References

 * dunno