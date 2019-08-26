# Anti-pattern: `:checked`

> `:checked` as an option for `<option>` is skipped. It does not feel well.

`:checked` is a CSS pseudo-class that can query the state of a checkbox or radiobox. However, there are several issues with `:checked`. 

1. The `checked` attribute in HTML is not updated. If you mark an unchecked checkbox with the `checked` attribute either in the HTML template or using `.setAttribute("checked", true)`, it becomes checked on screen. The same goes if you remove the `checked` attribute. But if you uncheck the checkbox using a mouse on screen, the `checked` attribute remains in the HTML version of the DOM. The JS property `.checked` changes, but the HTML template version remains unchanged. Thus, the DOM has a *static* `checked` HTML attribute and a *dynamic* `.checked` JS object property. Horrible. 
                                                                                         
2. In CSS you can therefore not use the attribute selector `[checked]` to query check- and radioboxes that are checked. Confusing. Instead, CSS uses a pseudo-class `:checked` selector to "fix" the problem of the broken DOM `checked` attribute. This gives us three(!) partially overlapping properties to contend with: the `checked` HTML attribute, the `.checked` JS property, and the `:checked` pseudo-class. Talk about redundancy. 

## Discussion: Which lessons can `checked` teach us?

If we need to make a similar attribute like `checked` in a web component or EventSequence today, how should we do it? 

1. It is clear that the `checked` attribute is broken. The DOM attributes (the HTML view) should be just as dynamic as the DOM properties (the JS view). With a dynamic `checked` attribute, you could *skip* both the current `:checked` pseudo-class and the separate `.checked` JS property as `.getAttribute("checked")` from JS and `[checked]` in CSS would serve the same purposes. 

> HTML is a declarative language, and declarative languages are synchronic. All its statements are true at the same time; it all happens at the same time. It is the opposite of an imperative programming language in which things happen one step at a time. The DOM is the current state of HTML. Any dynamic changes to the app's state (that is represented in the DOM, and not just as JS variables) *must* immediately be reflected in the DOM state. The DOM isn't a historic account of the original template; the DOM is always simply "the present reality", a reality that simply happened to be *first* described in an HTML template. 

2. We look now at `checked` from the perspective of EventSequences. Which sequence of events is the `checked` attribute and `<input>` elements responding to? Answer: `input` events. What would a cycle for such an `input` EventSequence look like? Answer: `<input>` elements under the same `<form>` would be grouped; it would start with an empty register; every time an `<input>` element first changes, it would be added to the register; every time a `<form>` is `submit`, the `<input>` element under that `<form>` would be reset in the register. 

   Now, which use-cases for pseudo-classes can we imagine for an EventSequence underlying `input` events?
   * If the user alters the value of a checkbox, radiobox, or any other `<input>` element, an `input` event should be dispatched. Consequently, an EventSequence can register *which* elements have been registered as getting new `input` since the page was first loaded. , and for example mark these "`<input>` elements altered during the current session" with an `:altered` pseudo-class.
   * If the value of an `<input>` element has been altered back to its original value (the value it had before the first `input` event), the element could be marked `:reset`.

This setup has many benefits. First, it does *not* provide redundant properties in JS and HTML. Second, it gives *more* information about the state of the users events than the current `:checked` debacle. For example would it be much simpler to give the user feedback about which inputs he has not yet answered, and which inputs he has answered and reset or answered and changed. And finally, such a pseudo-class would *be in line* with other pseudo-classes such as `:hover` and `:visited` that *also* reflect native EventSequences' state.

## Why view pseudo-classes as reflecting EventSequences' state?

It is not common to talk about CSS pseudo-classes as driven by EventSequences' state. Usually, we describe CSS pseudo-classes as associated with an element's state (only). However, I would argue that seeing many CSS pseudo-classes as event-regulated, and not element regulated, is necessary when you make composed events. Here's why.

HTML elements don't suddenly change state on their own. In order for the DOM and its elements to change state, an event must occur. Thus, when an element's state change, we usually think of this change first as an event. And therefore, when an element goes through as series of state changes, these changes can be viewed as driven by a sequence of events.

* One event can cause one state change in an element.
* One event sequence can cause an element to switch between several different states.

But, one event might affect more than one element. Some of the 
This means that the state of an EventSequence is *translated* into a set of states in DOM elements. *And*, some of the nuances and details of the EventSequence's state might be lost in translation. When you look at the translated, still result in the element's state in the DOM, you might not see the entire state of the EventSequence, only the aspect of the EventSequence that was relevant to this one element. On the other hand, if you focus clearly on the sequence of events that has occured to produce a certain state, then you are more likely to see a fuller picture. Thus, parts of the "logic behind" the altered DOM state might elude you if you view pseudo-classes in terms of individual elements. 

For me, the `:checked` pseudo-class is a good example of why and when seeing CSS pseudo-classes from the perspective of EventSequence state. 

> Can we learn from other's mistakes? `:checked`.

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)