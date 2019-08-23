# WhatIs: CSS pseudo-classes

Some events work independently of the DOM: `message`, `beforeprint`, `offline` could just as easily occur in a browser that did not contain a DOM. But most events occur in interaction with the DOM: `mouseover`, `click`, `input` happen as user input devices or scripts interact with an element.

## Pseudo-classes and EventSequences

When a sequence of native events progresses, we can imagine the state of underlying native EventSequences also changing. For example, when you move the mouse around in the browser, the mouse cursor position changes. Here, the sequence of `mousemove`s constitute a native EventSequence, and the position of the mouse that EventSequence's state.

Viewed in isolation, we could think of the state of `mousemove`s as a pair of variables: `mouse-x` and `mouse-y`. But, we could also view this native EventSequence's state in correlation with the DOM. We could "translate" this position into "DOM speak". In DOM speak, the position of the mouse cursor would not be a coordinate; in DOM speak, the position of the mouse cursor is translates into the DOM element over which the mouse `:hover`s.

Thus, some CSS pseudo-classes can be understood as a synthesis of an EventSequence's state and the DOM: 
 * The `:hover` pseudo-class reflects the state of `mousemove`s onto the would-be target element if the user did `click`. The `:hover` pseudo-class also bubbles and is applied both to the target and all its ancestors in the DOM. 
 * `:visited` reflects the state of navigation events onto `<a href="">` elements. Navigation is not normally thought of as an EventSequence, but it still is a sequence of navigation events that just spans both browser windows and sessions. `:visited` does *not* bubble, it is only applied to each link target.
 * `:focus` reflects the state of `focus` events onto active targets. `:focus` does not bubble, but has a sibling pseudo-class `:focus-within` that do.

## The benefit of viewing pseudo-classes as EventSequence state

CSS pseudo-classes are commonly *not* understood as driven by EventSequences' state, but by the state of the elements they attach to. However, I would argue that seeing CSS pseudo-classes as event-driven and not element-driven has clear benefits, especially when you make composed events and custom elements. And here's why.

HTML elements don't suddenly change state on their own. In order to change state, an event must occur. Thus, when an elements state change, the contextual change is driven by an underlying sequence of events. This means that:
 1. first an event causes the EventSequence state to change, and then
 2. second this change is then converted into a corresponding state in the DOM (ie. translated into DOM speak).

If you try to understand the "logic behind" the altered DOM states from the perspective of element first, it might be difficult to see clearly as some nuances of the "logic behind" it, because this "logic" is an event sequence state that has been translated into a DOM state.

However, if we look at the changes of the EventSequence state, we are looking directly at the underlying logic. Here, we do not need to consider important details lost in translation.

### Learn from eachother's mistakes? `:checked`

For me, the `:checked` pseudo-class is a good example of this confusion. `:checked` is a pseudo-class that CSS can use to query the state of a checkbox or radiobox. (I skip `:checked` as an option for `<option>`s as it doesn't work well.)

There are several issues with `:checked`. 

1. The `checked` attribute in HTML is not updated. If you mark an unchecked checkbox with the `checked` attribute either in the HTML template or using `.setAttribute("checked", true)`, it becomes checked on screen. The same goes if you remove the `checked` attribute. But if you uncheck the checkbox using a mouse on screen, the `checked` attribute remains in the HTML version of the DOM. The JS property `.checked` changes, but the HTML template version remains unchanged. Thus, the DOM has a *static* `checked` HTML attribute and a *dynamic* `.checked` JS object property. Horrible. 
                                                                                         
2. In CSS you can therefore not use the attribute selector `[checked]` to query check- and radioboxes that are checked. Confusing. Instead, CSS uses a pseudo-class `:checked` selector to "fix" the problem of the broken DOM `checked` attribute. This gives us three(!) partially overlapping properties to contend with: the `checked` HTML attribute, the `.checked` JS property, and the `:checked` pseudo-class. Talk about redundancy. 

So, how *should* `checked` have been implemented? How should we solve a similar problem if you were to make a similar custom element and/or related EventSequence today? 

First, it is clear that the `checked` attribute is broken. The DOM attributes (the HTML view) should be just as dynamic as the DOM properties (the JS view). With a dynamic `checked` attribute, you could *skip* both the current `:checked` pseudo-class and the separate `.checked` JS property as `.getAttribute("checked")` from JS and `[checked]` in CSS would serve the same purposes. 

Second, we can also make some custom CSS pseudo-classes for an EventSequence for `input` events. When a checkbox, radiobox, and any other `<input>`/`<textarea>` element is *altered*, they would dispatch an `input` event. If a sequence of all `input` events are registered, elements that has been altered once could be marked with an `:altered` pseudo-class. Similarly, every element whose current value differs from its initial value could be marked with a `:changed` pseudo-class.

This setup has many benefits. First, it does *not* provide redundant properties in JS and HTML. Second, it gives *more* information about the state of the users events than the current `:checked` debacle. For example would it be much simpler to give the user feedback about which inputs he has not yet answered, and which inputs he has answered and reset or answered and changed. And finally, such a pseudo-class would *be in line* with other pseudo-classes such as `:hover` and `:visited` that *also* reflect native EventSequences' state.

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)