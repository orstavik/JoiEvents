# Pattern: DeepStateEventDetails

## What is "deep state"?

The term "deep state" comes from politics and describe networks of people that work to further their own agenda within a state. The "deep state" group rules themselves. They cannot be fully controlled by the state. "Deep states" are problematic for both democracies and kings alike in that they often can work against the expressed interests of the state when it conflicts with their own objectives. 

"Deep state" is neither good nor bad. It depends on your perspective. On the one hand, if you have just voted in a new government that wants to teach kids to code, you might be less happy about a ministry of education "doing things the old way". On the other hand, if your democratically elected president is utterly incompetent, you might be happy that the "deep state" hides the nuclear launch codes from him (ref the nytimes article about Trump). 

## Deep state in programming

In programming, the term "deep state" is a good fit for state data that:

1. is buried deep in an app,
2. set by sources outside the app's control, 
3. influence the running of the app, and
4. which might even be only indirectly observable.
 
When the "deep state" data works in harmony with the rest of the app, we most often consider it good. The deep data is appropriately encapsulated. After all, if we don't need to know the details and they don't contradict our apps behavior, then why would we want to bother with them?

When "deep state" data conflicts or needs to be synchronized with expressed behavior in the app, it is another matter entirely. In these situations we need to control and set the deep state, so that the behavior the data influences is synced with the behavior of the app.

## Deep state in EventSequences

EventSequences are structured as self-contained functions (SIFs). SIF is a *good* way to encapsulate the inner workings of an EventSequence. After all, the EventSequence manages lots of implementation details that are:
1. constant (such as how the sequence of events causes its states to change), or
2. irrelevant (such as event listeners for erroneous gestures, cf. chapters on mouse and touch gestures).

Thus, most of the EventSequences' state we want to keep as "deep state", managed as inner variables in this SIF or cycles of ListenUp event listeners triggering each other.

## Demo

todo
we can use long-press with duration and start time. 

## Open state data as declarative programming

Declarative programming is one of those concepts that is hard to wrap ones head around. But, I hope that if you understand the full concept of how state data from EventSequences can control the feedback presentation via CSS, you will get some deeper understanding of both *what* declarative programming means and *why* it might be preferable to imperative programming.

The use-case of feedback from EventSequences is as follows:
1. You have an EventSequence such as `long-press`.
2. You wish to add a symbol or icon to this event.
3. This symbol should play a small animation when the user starts to press it, and then play a different animation when the user stops pressing.

Now, you know how to:
1. Make the symbol in HTML and CSS.
2. Add a small animation to your HTML and CSS symbol using CSS animations (`@keyframes`).
3. You also know how to control the CSS rules for your symbol (show/hide the element and start/stop/switch between animations) using different CSS rules.
4. The only thing you don't have a clear pattern for is how to control these CSS rules from your event.

But, wait. That is not too hard. I write my CSS rules to be activated/deactivated based on the presence of for example CSS classes in the DOM.

> todo maybe I should add a Global variable for EventSequences, so that others can read the values? And write protect them?

## Further reading

And the simplest data to store is the triggering event objects themselves. 



## References

 * [MDN: CSS `attr()`](https://developer.mozilla.org/en-US/docs/Web/CSS/attr)