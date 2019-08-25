# WhatIs: CSS pseudo-classes

We know that some events target elements in the DOM (cf. WhatIs: the target). We know that events propagate and can trigger JS functions. But, we havn't yet discussed how events can influence CSS and turn CSS rules on/off. Its time to talk about CSS pseudo-classes.

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
 
## What do pseudo-classes do?

Let's start with the basics: normal CSS classes. We know that:
1. CSS classes are added to HTML elements by simply putting their name in the element's `class` attribute. 
2. In a stylesheet, CSS rules can then reference elements with a CSS class by writing `.classname`.
3. The general idea is: add a CSS class to an element, and you turn *on* a CSS rule; remove a CSS class from an element, and you turn *off* the CSS rule. (Of course, this can be morphed using `:not()` and other CSS selectors, but you get the idea.) 

Now, what if you want a CSS rule to *only* apply to an element when that element plays a particular role in an EventSequence's state? For example, what if you wanted a CSS rule to only apply to an element when the mouse cursor hovers over it?
 
The obvious thing the EventSequence would then do would be to automatically add a CSS class to an element when it entered a certain state, and then automatically remove that CSS class again when its state changed again.

The nice thing with class names, is that apart from CSS rules, it makes no difference if we take them away from an element. The only thing that happens if we remove a class name from an element, is that we can turn off (or on) different styles on that element. CSS class names are on/off buttons for CSS rules.

Pseudo-classes are used in CSS selectors. CSS selectors are the head of CSS rules. When a CSS selector matches an element, all the CSS properties and values in the CSS rule body is applied to that element.

When an EventSequence changes state, it essentially adds a class to an invisible `pseudo-class` attribute next to the `class` attribute on the element. adds a CSS pse

## Why view pseudo-classes as reflecting EventSequences' state?

It is not common to talk about CSS pseudo-classes as driven by EventSequences' state. Usually, we describe CSS pseudo-classes as associated with an element's state (only). However, I would argue that seeing many CSS pseudo-classes as event-regulated, and not element regulated, is necessary when you make composed events. Here's why.

HTML elements don't suddenly change state on their own. In order for the DOM and its elements to change state, an event must occur. Thus, when an element's state change, we usually think of this change first as an event. And therefore, when an element goes through as series of state changes, these changes can be viewed as driven by a sequence of events.

* One event can cause one state change in an element.
* One event sequence can cause an element to switch between several different states.

But, one event might affect more than one element. Some of the 
This means that the state of an EventSequence is *translated* into a set of states in DOM elements. *And*, some of the nuances and details of the EventSequence's state might be lost in translation. When you look at the translated, still result in the element's state in the DOM, you might not see the entire state of the EventSequence, only the aspect of the EventSequence that was relevant to this one element. On the other hand, if you focus clearly on the sequence of events that has occured to produce a certain state, then you are more likely to see a fuller picture. Thus, parts of the "logic behind" the altered DOM state might elude you if you view pseudo-classes in terms of individual elements. 

### Have I learned from other's mistakes? `:checked`

For me, the `:checked` pseudo-class is a good example of why and when seeing CSS pseudo-classes from the perspective of EventSequence state. 

`:checked` is a CSS pseudo-class that can query the state of a checkbox or radiobox. (I skip `:checked` as an option for `<option>`s as it doesn't work well.) However, there are several issues with `:checked`. 

1. The `checked` attribute in HTML is not updated. If you mark an unchecked checkbox with the `checked` attribute either in the HTML template or using `.setAttribute("checked", true)`, it becomes checked on screen. The same goes if you remove the `checked` attribute. But if you uncheck the checkbox using a mouse on screen, the `checked` attribute remains in the HTML version of the DOM. The JS property `.checked` changes, but the HTML template version remains unchanged. Thus, the DOM has a *static* `checked` HTML attribute and a *dynamic* `.checked` JS object property. Horrible. 
                                                                                         
2. In CSS you can therefore not use the attribute selector `[checked]` to query check- and radioboxes that are checked. Confusing. Instead, CSS uses a pseudo-class `:checked` selector to "fix" the problem of the broken DOM `checked` attribute. This gives us three(!) partially overlapping properties to contend with: the `checked` HTML attribute, the `.checked` JS property, and the `:checked` pseudo-class. Talk about redundancy. 

So, how *should* `checked` have been implemented? How should we solve a similar problem if we were to make a similar custom element and/or EventSequence today? 

First, it is clear that the `checked` attribute is broken. The DOM attributes (the HTML view) should be just as dynamic as the DOM properties (the JS view). With a dynamic `checked` attribute, you could *skip* both the current `:checked` pseudo-class and the separate `.checked` JS property as `.getAttribute("checked")` from JS and `[checked]` in CSS would serve the same purposes. 

Second, we can also make some custom CSS pseudo-classes for an EventSequence for `input` events. When a checkbox, radiobox, and any other `<input>`/`<textarea>` element is *altered*, they would dispatch an `input` event. These `input` events should be registered by the EventSequence, so that elements that has been altered once could be marked with an `:altered` pseudo-class. Similarly, every element whose current value differs from its initial value could be marked with a `:changed` pseudo-class.

This setup has many benefits. First, it does *not* provide redundant properties in JS and HTML. Second, it gives *more* information about the state of the users events than the current `:checked` debacle. For example would it be much simpler to give the user feedback about which inputs he has not yet answered, and which inputs he has answered and reset or answered and changed. And finally, such a pseudo-class would *be in line* with other pseudo-classes such as `:hover` and `:visited` that *also* reflect native EventSequences' state.

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)