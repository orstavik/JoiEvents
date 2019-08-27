# WhatIs: CSS pseudo-classes

We know that some events target elements in the DOM (cf. WhatIs: the target). We know that events propagate and can trigger JS functions. But, we havn't yet discussed how events can influence CSS and turn CSS rules on/off. Its time to talk about CSS pseudo-classes.

## How does pseudo-classes work?

Let's start with normal CSS classes. We know that:
1. Normal CSS classes are added to HTML elements by simply putting their name in the element's `class` attribute. 
2. In a stylesheet, CSS rules can then reference elements with a normal CSS class by writing `.classname`.
3. The general idea is: add a normal CSS class to an element, and you turn *on* a CSS rule; remove a CSS class from an element, and you turn *off* the CSS rule. (We are obviously disregarding `:not()` and other combinations of CSS selectors at this point. You get the idea.) 

But, what if you wanted a CSS rule to be turned on when it played a particular role in an EventSequence's state, and *off* when it no longer did? For example, what if you wanted a CSS rule to only apply to an element when the mouse cursor hovers over it?

We could do that with a) lots of event listeners and b) a normal CSS class. We could:
1. add an event listener for `mouseenter` to *all* elements, and then 
2. have this event listener add a normal CSS class `.hover` to that element, and then
3. add a similar event listener for `mouseleave` that
4. removed the `.hover` class again. 

But, there are a couple of drawbacks to this approach.
1. To add these event listeners in JS would both be extremely costly to mousemove performance *and* produce lots of boilerplate code as many apps would re-implement it again and again.
2. The `.hover` class name is not protected. The developer might accidentally remove or add it to an element's `classList`. 

Enter CSS pseudo-class. We already know that native EventSequence that observes a group of underlying events will dispatch event objects to JS event listeners. But, the same native EventSequence will also, depending on its state:
1. add and remove special `:`-pseudo-classes 
2. to a protected pseudo-classList on DOM elements, 
3. *automatically*. 

For example, the native EventSequence observing mousemoves will both:
1. dispatch `mouseenter` and `mouseleave` events to JS, and
2. add and remove the `:hover` pseudo-class to DOM elements, that can be
3. queried from CSS selectors as `:hover`. 

## Pseudo-classes and EventSequences

When a sequence of native events progresses, we can imagine an underlying native EventSequences keeping track of its state. For example, when you move the mouse around on screen, the mouse cursor position changes. The `mousemove`s form a native EventSequence with the mouse position as its state.

Seen in the screen window, we can think of the mouse position as a simple coordinate: `x`, `y`. But, this is not the *only* way to view a mouse position in a web site: we could also think about the mouse's position as *hovering* over different DOM elements. The "real" mouse position is the same, its viewed from two different angles: one from the screen pixels, another from the DOM elements.

Several CSS pseudo-classes do just that. They represent/translate an EventSequence's state in DOM terminology: 
 * The `:hover` pseudo-class reflects which element the mouse cursor currently hovers over.  
 * `:visited` reflects the state of navigation events onto `<a href="">` elements. Navigation is an unusual EventSequence as it can span across both browser windows and sessions. 
 * `:focus` reflects the state of `focus` events onto active targets. 
 
And. There is more evidence of the close relationship between pseudo-classes and events. We know that some events bubble and some events do not. Similarly, some pseudo-classes are applied to both their target and all its DOM ancestors, while others are applied only to the target.
 * The `:hover` pseudo-class bubbles.
 * The `:visited` does not bubble.
 * The `:focus` does not bubble, but it has a sibling pseudo-class `:focus-within` that is applied to its ancestors.

## Demo: `.hover` EventSequence

todo. It is possible to add an example of an EventSequence that adds `.hover` to the element.

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)