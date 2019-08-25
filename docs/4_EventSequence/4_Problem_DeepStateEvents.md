# Problem: DeepStateEvents

## What is "deep state"?

"Deep state" is state data that is buried so deep in an app that it is:
 * uncontrollable, 
 * cannot be accessed and read consistently, and/or 
 * hidden so deep the developer cannot easily find it. 

So far, we have stored the state as an inner variable in the EventSequence self-contained function (sif). And inner variables in sifs cannot be read by any other part of the app. Inner variables in EventSequences are deep state programming.

## What's the problem with deep state?

Why is "deep state" sometimes considered bad practice and sometimes best practice? Why isn't it a good thing to encapsulate these variables about the inner state of EventSequences inside their functions? After all, no one else probably needs them, right? And so our main concern therefore is to protect them so that no one else can accidentally mess them up? Is this "deep state" term yet more "functional programming" mumbo jumbo? Just another way of saying "object orientation is evil"?

For a simple `long-press` EventSequence this might seem true. It might look like you are encapsulating and protecting the events' inner data from being corrupted from someone outside doing something stupid. You are not "adding" anything, at least not any "hidden, deep state data". It might look like a conceptually and architecturally wise decision. 

But. There is one small glitch. Someone else needs your EventSequence's state data. The glitch is that you just didn't see it. So what happens then? A new use-case emerges. And you suddenly find that you need to access to the state data. Now, if you have already pushed this state data deep into a closed sif, you can't get it out. And so you instead, you must reproduce the data. And presto! You have a redundancy. Which is inefficient. And which complicates your code. And which is very likely to cause you headaches later.
   
This story is *exactly* what happened with deep state in EventSequences in this project. At first, I thought it was a good thing to use sif-internal variables for EventSequences like `long-press`. And so I built several EventSequences with deep state. But then a new use-case arrived: I needed to give feedback from the events. The user needed to understand what was going on with an EventSequence, and I had to produce visuals, sounds, and vibrations that did this. The sounds and vibration could well be controlled from JS, but the visuals? These visuals is best done in HTML and CSS. And that was when I realized that I had a new use-case on my hands and that I needed to access my EventSequences' deep state data from *both* other JS context *and* CSS. 

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

## Further reading

In the next chapters, I will focus on how to add 

## References

 * [MDN: CSS `attr()`](https://developer.mozilla.org/en-US/docs/Web/CSS/attr)