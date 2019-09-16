# WhatIs: Visual Event Feedback

There are three different ways to control the visual feedback for native events:
1. Pseudo-classes
2. CssEventControl settings
3. GetSetEvent methods

## Pseudo-classes

Several EventSequence functions that control native events in the browser automatically add/remove pseudo-classes to relevant elements in the DOM. These pseudo-classes reflect the state of the native EventSequence, and this state is almost exclusively communicated out to the user visually.

There are three different locations where pseudo-classes can be used to alter the appearance of the app so as to alert the user of the native EventSequence's state:
   1. From within native elements. The native link element, `<a href>`, change the color of the text and underline depending on the pseudo-class `:visited`.
   2. From within custom element. Custom elements can alter the style of the host element or other shadowDOM elements depending on the EventSequence state, cf. `:host(:hover)`.
   3. From within app code. Commonly, pseudo-classes are also used by regular app developers when they style their lightDom elements to communicate the state of their apps to their users.

## CssEventControls settings

Commonly, CssEventControls are used to select one of a small group of predefined visual feedback expressions. For example, the CSS `cursor` property can alter the visual feedback image of the mouse cursor as it hovers different elements. Adding a CSS rule `.helpers {cursor: help;}` to a selection of elements will cause the mouse cursor to display a `?` when it hovers over `.helpers` elements.

When CssEventControls are used, the native EventSequence function controlling the EventSequence is in direct control of the visual feedback. This means that even though the visual feedback image is chosen by CSS settings attached to the DOM, the presentation of the the visual feedback image is DOM independent. For example, the position of the cursor image is context dependent to the x/y-coordinates on the screen.

CssEventControls are heavy to process. Custom CssControls for custom EventSequences should therefore not be used for highly fluid changes; CssEventControls should only be read intermittently, such as in a StartEvent. The native `cursor` property is an exception to this rule. If you add many different `cursor` properties to the DOM, the image of the mouse cursor could vary in high frequency as you move the mouse around the web page. However, as this event is implemented natively, the browser can implement behind the scenes shortcut to speed up this one CssEventControl, using resources not available to normal web app developers.

## GetSetEvent methods 

The `.setDragImage(...)` is an example of a setter method on a native event object used to alter the visual feedback image of an event. 

As with the visual feedback of `cursor` and CssEventControls, visual feedback image passed in using a setter method on the `dragstart` event is also a) controlled by the EventSequence function and b) presented DOM independently, instead positioned on top of the screen, relative to the cursor position on screen. 

The `.setDragImage(...)` can only be called on the `dragstart` event for native drag'n'drop EventSequences (ie. *not* on `drag` event objects). However, if you need to implement a mechanism for displaying highly fluid changes in a custom EventSequence, then the GetSetEvent pattern is what you want.

## Discussion

CssControls chooses a visual feedback image from a predefined set; GetSetEvent adds a custom made visual image (as an element).

Natively, CssEventControls and GetSetEvent methods are not used in parallel. However, when setting up custom event controlling functions, this might be a good fit. If *both* CssEventControls and GetSetEvent methods are made available for the same visual feedback image, such as a `cursor` and `setCursorImage()` on a `mouseenter` event, then the GetSetEvent method should override any CssEventControls set on the same element.

## References

 * []()