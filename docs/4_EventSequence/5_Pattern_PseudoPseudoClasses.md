# Pattern: PseudoPseudoClasses

CSS pseudo-classes can reflect the state of native EventSequences. In this chapter we look at how we can implement our own pseudo pseudo-classes.

## HowTo: implement CSS classes

A native CSS pseudo-class is:

1. a weird CSS class
2. attached to different HTML elements
3. *not* directly visible in the normal DOM, but can be imagined as added to an invisible pseudo-class attribute
4. can be selected using the colon `:pseudo-class-name`, instead of the normal class prefix `.`.
5. automatically added and removed to and from an element by a native EventSequence.
 
Currently, we cannot create custom CSS pseudo-classes. We cannot add classes to the invisible list of pseudo-class, and so we cannot query such a class using the `:`. 

But. We can *fake it* with normal CSS classes. We can:

1. make EventSequences that automatically add and remove normal CSS classes from elements in the DOM.
2. query these CSS classes using the normal `.`-selectors.

EventSequences that automatically adds and removes normal CSS classes to DOM elements we call PseudoPseudoClass.

## Demo: `.long-press` PseudoPseudoClass

In this demo we will add a PseudoPseudoClass to our `long-press` EventSequence. When the `long-press` EventSequence is activated, a CSS class `.long-press` is added to the target element and all its ancestors. When the `long-press` EventSequence is deactivated, the `.long-press` class is then removed from the same list of elements.

Adding the `.long-press` PseudoPseudoClass to the target reflects the state of the EventSequence in the DOM. If the name of the pseudo-class had been reserved as it is with the regular `:`-prefixed pseudo-classes, the EventSequence would not need to worry about CSS class naming conflicts. As we can't hide the elements from other DOM operations nor preserve the CSS class names we use, the `long-press` EventSequence must store the list of elements that it added the PseudoPseudoClass to so that it doesn't accidentally remove or add css classes to any element that it shouldn't.

When the EventSequence adds the `.long-press` PseudoClass to the target element (and its ancestors), it essentially preserves its state and `target`:
1. The name of the PseudoPseudoClass, here `.long-press`, preserves the EventSequence's type and stage.
2. The lowest element in the DOM given this PseudoPseudoClasses represent the `target` of the EventSequence.
 
todo add this demo

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)