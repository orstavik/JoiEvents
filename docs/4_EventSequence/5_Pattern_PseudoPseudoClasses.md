# Pattern: PseudoPseudoClasses

In WhatIs: PseudoClasses we saw how CSS pseudo-classes can be understood as reflecting the state of native EventSequences. In this chapter we look at how we can implement our own pseudo pseudo-classes.

CSS pseudo-classes are essentially:

1. CSS classes, that
2. are *not* directly visible in the normal DOM, and that
3. instead of being queried using a single dot `.` are queried using a colon `:`, and that
4. are automatically added and removed on an element by a native EventSequence of some kind.
 
The browsers do not allow us to custom, authentic CSS pseudo-classes: we cannot make a) invisible CSS classes that b) can be queried using a `:`. But. The rest we can do:

1. We can automatically add and remove CSS classes from custom EventSequences.
2. These CSS classes will be visible in the DOM, as they are normal CSS classes.
3. And we can query these CSS classes using `.`-selectors.

## Demo: `.long-press` PseudoPseudoClass

In this demo we will add a PseudoPseudoClass to our `long-press` EventSequence. When the `long-press` EventSequence is activated, a CSS class `.long-press` is added to the target element and all its ancestors. When the `long-press` EventSequence is deactivated, the `.long-press` class is then removed from the same list of elements.

Adding the `.long-press` PseudoPseudoClass to the target reflects the state of the EventSequence in the DOM. If the name of the pseudo-class had been reserved as it is with the regular `:`-prefixed pseudo-classes, the EventSequence would not need to worry about CSS class naming conflicts. As we can't hide the elements from other DOM operations nor preserve the CSS class names we use, the `long-press` EventSequence must store the list of elements that it added the PseudoPseudoClass to so that it doesn't accidentally remove or add css classes to any element that it shouldn't.

When the EventSequence adds the `.long-press` PseudoClass to the target element (and its ancestors), it essentially preserves its state and `target`:
1. The name of the PseudoPseudoClass, here `.long-press`, preserves the EventSequence's type and stage.
2. The lowest element in the DOM given this PseudoPseudoClasses represent the `target` of the EventSequence.
 

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)