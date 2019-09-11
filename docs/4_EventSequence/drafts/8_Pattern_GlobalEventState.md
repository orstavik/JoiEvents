# Pattern: GlobalEventDetails

## GlobalEventDetails as settings

Not *all* the state details in an EventSequence are constant and irrelevant. Take for example the `duration` of a `long-press`.

Different apps that require different timing for something to be a `long-press`. One app might for example use `long-press` to delete targets. In such a case, you would like its duration to be at least 1000ms. Another app might use `long-press` to select multiple items together, and here a duration of 500ms should suffice. 

By making sure that the app can control the duration of a `long-press` thus makes the composed event *reusable*, from app to app. 

## GlobalEventDetails as controls

> todo maybe I should add a Global variable for EventSequences, so that others can read the values? And write protect them?

Apps also often need to control an EventSequence's global behavior:

 * etc.

There are three different purposes for GlobalEventDetails:
 * set a global property such as `long-press` `duration`,
 * read a global property such as todo
 * control a 


## Demo: `EventLongPress.duration` and `EventLongPress.stop()` 

In this demo I illustrate the 



Furthermore, apps might also need to set different types of requirements to an EventSequence. One app might use both `drag` and `long-press` to control the same elements in their UI. This app might therefore need to disable `long-press` on elements that moves the mouse too much before letting go of their fingers.

Some use-cases can have a low tolerance for gesture errors. Some use-cases can have a higher tolerance for delay than others. Use-cases can be more or less performance sensitive. And some use-cases might require customization of visual or audio feedback. It all varies. 

s must be able to control and set the duration of the `long-press` EventSequence from somewhere.


Sometimes we want some details of an EventSequence's state to be readable from JS. There are several ways to accomplish thisTo do so, we simply add a global object on the `window`, such as `EventLongPress` and populate it when needed.

The benefits of adding such a global object is not only that it can be used to read the details of an EventSequence's state (when it is going on), but also that the presence of the global object itself can be used to assess whether or not you need to load a `long-press` library or not.

## References

 * [dunno]()