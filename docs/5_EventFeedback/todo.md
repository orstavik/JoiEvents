These methods pass in a single element that the EventSequence then displays in a DOM independent manner (cf. BlindManDom). The GetSetEvent methods can be used for fluid changes, although it is more efficient with css animations, if possible. Pseudo-classes can be added to the element passed as visual feedback)

Visual Feedback. Setting visual feedback for the elements in the DOM is the responsibility of the developers with access to style the elements in the DOM's job: the app developer who can style the document, and the (custom) element developer.

The responsibility of the EventSequence is only to add pseudo-classes to the relevant DOM elements when its state changes, so that the app developer and the element developer have something to attach the style rules to.

But, an EventSequence may also have a DOM independent visual feedback. The mouse cursor for example. Or the small “768x902“ label you see on the top-right screen when you resize the window in Chrome on desktop.

The DOM independent visual feedback exists not in the DOM, but temporarily lies above it. It is a software generated, platform level feedback.

So, while pseudo-classes regulate DOM dependent feedback, how do we a) make DomIndependentVisualFeedback and b) how do we control it?

To control the visual feedback, we can use a) CssControlEvent settings and/or b) GetSetEvent. The CssControls are used when you wish to select one of a predefined set of visual images. The regular 'cursor' property is a good example of such a visual control.

HowTo: set 'cursor'?

The property is added to the element, but it is read and associated from an EventSequence that controls the mouse. Whenever the mouse moves, the mouse EventSequence will find the property pf the current target and then display that image. It is the DOM that styles the image that lies above the DOM.

That is displayed separately from the DOM.

To set the visual feedback using GetSet methods, you essentially pass in an element in the DOM that will fill/replace an image set by the browser. Using JS (as opposed to CSS) enables the developer to create a completely new element. And the GetSet methods can get values such as a coordinate or timing information, and then use this data in its construction of an element it then Sets on the EventSequence event object.




A trick. Pass in a custom element as the visual element in the GetSetEvent. This is efficient, a great way to encapsulate css styles, and enables the developer to add custom data about position or timing read from GetSet as attributes that can alter appearance, animations, and add text.

HowTo: set Image on drag'n'drop events

This pattern works similarly for drag'n'drop events, except that drag'n'drop events can only add an image, not an html branch. In the StartEvent, you set the image of the drag element ghost, and it will remain so until the drag event sequence concludes.

Demo: long-press with CssControls

Demo: long-press with GetSet

Demo: long-press with both CssControls and GetSet.

I first make the two HowTo chapters. They are smaller, and then i add the description of what you can and cannot do here.

And, i add also a tip of how custom elements can be used from css properties too. This i maybe should have a separate chapter about.

At the end.

## 



## References

 * []()