# WhatIs: Visual Event Feedback

There are three different ways to control the visual feedback for native events:
1. Pseudo-classes on target elements
2. Setter method on event objects
3. CSS property on target elements

## Pseudo-classes on target elements

Several EventSequence functions that control native events in the browser automatically add/remove pseudo-classes to relevant elements in the DOM. These pseudo-classes reflect the state of the native EventSequence, and this state is almost exclusively communicated out to the user visually.

There are three different locations where pseudo-classes can be used to alter the appearance of the app so as to alert the user of the native EventSequence's state:
1. From within native elements. The native link element, `<a href>`, change the color of the text and underline depending on the pseudo-class `:visited`.
2. From within custom element. Custom elements can alter the style of the host element or other shadowDOM elements depending on the EventSequence state, cf. `:host(:hover)`.
3. From within app code. Commonly, pseudo-classes are also used by regular app developers when they style their lightDom elements to communicate the state of their apps to their users.
   
For more details on the creation and use of pseudo-classes, see the previous chapter on EventSequences.

## Setter method on event objects

The native drag'n'drop EventSequences provide a `.setDragImage(...)` method on its `dragstart` event. The `.setDragImage(element)` alters the visual feedback image during a drag'n'drop sequence, by passing an `element` as an attribute.

```javascript
window.addEventListener("dragstart", e=> {
  var img = new Image(); 
  img.src = 'sunshine.gif'; 
  e.dataTransfer.setDragImage(img, 10, 10);
});
```

There are a couple of implementation details to note for `.setDragImage(...)`:
1. `.setDragImage(...)` can only be called on the `dragstart` event. You cannot call `.setDragImage(...)` from a `drag` event listener. 
2. The `dataTransfer` object is specific to drag'n'drop. Other EventSequences implementing a similar pattern should add their similar method to the Event object itself.

As with `cursor`, a visual feedback CSS property described below, visual feedback image passed in using a setter method on the `dragstart` event is also a) controlled by the EventSequence function and b) presented DOM independently, ie. positioned on top of the screen, relative to the cursor position on screen. 

If you need to implement a mechanism for displaying highly fluid changes in a custom EventSequence, then the GetSetEvent pattern is what you want.

## CSS property on target elements

CSS properties can be used to select one of a small group of *predefined* visual feedback expressions. For example, the CSS `cursor` property can alter the visual feedback image of the mouse cursor as it hovers different elements. Adding a CSS rule `.enemies{ cursor: crosshair; }` to a selection of elements will cause the mouse cursor to display a `crosshair` symbol when it hovers over `.enemies` elements.

When CSS properties are used, the native EventSequence function controlling the EventSequence is in direct control of the visual feedback. This means that even though the visual feedback image is chosen by CSS settings attached to the DOM, the presentation of the the visual feedback image is DOM independent. For example, the position of the cursor image is context dependent to the x/y-coordinates on the screen.

CSS properties are heavy to process. Custom CssEventControls for custom EventSequences should therefore not be used for highly fluid changes; CssEventControls should only be read intermittently, such as in an infrequent StartEvent. The native `cursor` property is an exception to this rule. The `cursor` CSS property differs from this model: it can change frequently. If many different elements has different `cursor` properties, then the cursor image can vary rapidly with mousemoves. But, `mousemove` events and the `cursor` are implemented natively, and the browsers can employ lots of tricks to speed up the execution of this *one* CSS property in its native EventSequence, tricks not available to normal web app developers.

## Discussion

CssControls chooses a visual feedback image from a predefined set; GetSetEvent adds a custom made visual image (as an element).

Natively, CssEventControls and GetSetEvent methods are not used in parallel. However, if a custom event controlling functions choose to make both available at the same time, (imagine `setCursorImage()` setter method on a `mouseenter` event combined with today's `cursor` CSS property), then the GetSetEvent method should override any CssEventControls set on the same element.

Composed events and EventSequences should likely combine all three methods in their implementations.

These use-cases can be controlled from both CSS and JS. It is likely, that custom composed events should implement *both* CSS properties to select or do minor alterations between default visual feedback expressions, and JS setter methods to so which method is used to control the feedback depends  Different events have different preferences

## References

 * []()