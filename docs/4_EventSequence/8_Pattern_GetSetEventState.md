# Pattern: GetSetEventDetails

## When and why do we need to set EventDetails

Not *all* the state details in an EventSequence are constant. Take for example the `duration` of a `long-press`.

Different apps that require different timing for something to be a `long-press`. One app might for example use `long-press` to delete items. In such a case, you would like its duration to be at least 1000ms. Another app might use `long-press` to select multiple items together. In such a case, a duration of 500ms should suffice. To make a `long-press` composed event *reusable*, apps must be able to control and set the duration of the `long-press` EventSequence from somewhere.

Furthermore, a single app might also need to vary the duration of `long-press` for different elements or states. For example, a single app might use `long-press` to select multiple targets for one group of elements, while also using `long-press` to delete targets for another group of elements. Being able to set the duration of 


A shoot-asteroid game might for example require the player to press longer on bigger asteroids and shorter on small. on bigger `long-press` to *both* select multiple items *and* 

 2. one would have to be able to set this from somewhere inside the app. One might also easily imagine a game that may require you to press on different elements at different length to obtain a press. One might also easily imagine that an app needed to know about this duration in advance, so as to for example control an animation somewhere else on screen.


For a simple `long-press` EventSequence this might seem true. It might look like you are encapsulating and protecting the events' inner data from being corrupted from someone outside doing something stupid. You are not "adding" anything, at least not any "hidden, deep state data". It might look like a conceptually and architecturally wise decision. 

But. There is one small glitch. Someone else needs to sync with your EventSequence's state data. The glitch is that you just didn't see it. So what happens then? A new use-case emerges. And you suddenly find that you need access to the state data. Now, if you have already pushed this state data deep into a closed sif, you can't get it out. What do you do then?

And so you instead, you must reproduce the data. And presto! You have a redundancy. Which is inefficient. And which complicates your code. And which is very likely to cause you headaches later.
   
This story is *exactly* what happened with deep state in EventSequences in this project. At first, I thought it was a good thing to use sif-internal variables for EventSequences like `long-press`. And so I built several EventSequences with deep state. But then a new use-case arrived: I needed to give feedback from the events. The user needed to understand what was going on with an EventSequence, and I had to produce visuals, sounds, and vibrations that did this. The sounds and vibration could well be controlled from JS, but the visuals? These visuals is best done in HTML and CSS. And that was when I realized that I had a new use-case on my hands and that I needed to access my EventSequences' deep state data from *both* other JS context *and* CSS. 



Sometimes we want some details of an EventSequence's state to be readable from JS. There are several ways to accomplish thisTo do so, we simply add a global object on the `window`, such as `EventLongPress` and populate it when needed.

The benefits of adding such a global object is not only that it can be used to read the details of an EventSequence's state (when it is going on), but also that the presence of the global object itself can be used to assess whether or not you need to load a `long-press` library or not.

## References

 * [dunno]()