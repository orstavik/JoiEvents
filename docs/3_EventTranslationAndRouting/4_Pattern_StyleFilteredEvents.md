# Pattern: StyleFilteredEvents

`pointer-events: none;` will deactivate an event for a given 

We want the details of an EventSequence's state to be readable from JS. To do so, we simply add a global object on the `window`, such as `EventLongPress` and populate it when needed.

The benefits of adding such a global object is not only that it can be used to read the details of an EventSequence's state (when it is going on), but also that the presence of the global object itself can be used to assess whether or not you need to load a `long-press` library or not.

## References

 * [dunno]()
 
 
 # Pattern: PseudoCssVariables
 
 The PseudoPseudoClass allows us to store information about a) which stage the EventSequence is in and b) its target. The PseudoPseudoClass does by adding CSS classes *in the DOM*, making it accessible from JS and CSS. And finally, PseudoPseudoClasses can bubble, making them referable from a wider CSS context. 
 
 But. PseudoPseudoClasses is not enough. A `long-press` EventSequence would also need to preserve *details* about its state such as its start time and start position. These state details are needed by *both* subsequent trigger functions in the EventSequence *and* CSS rules for feedback elements. Thus, this data should also be reflected in the DOM, but as CSS variables so that they may be used in other CSS properties.
 
 The state of EventSequences needs to be reflected into the DOM by *two* different means:
 1. The *existence* and *target* of a particular EventSequence's stage should be used in CSS selectors to turn different CSS rules on/off. CSS ((pseudo-)pseudo-)classes is a good fit for this job.
 2. The *details* of an EventSequence's state might be used *directly* as a value in another CSS properties. To accomplish this, we need to store the state details as custom CSS properties/CSS variables.
 3. The picture is therefore that the EventSequence will add some PseudoPseudoClasses that can turn on/off CSS rules, and that these CSS rules in turn can use details about the EventSequences' state directly in their properties as some CSS variables that are populated automatically by the EventSequence.
 
 > CSS variables is a better alternative than HTML attributes for this purpose. HTML attributes do not cascade in the DOM/CSSOM, while CSS variables cascade in the CSSOM. Furthermore, the CSS `attr()` function does not work. This means that you cannot *use* the value of an HTML attribute in a CSS property, while CSS variables and `var()` are built for precisely this purpose.
 
 ## Where to store the CSS variables
 
 Ok. So the situation is: we will store the EventSequences' state details as CSS variables. This will enable us to use these properties directly in other CSS rules. And that is handy, as we will see in detail later when we discuss event feedback in more detail.
 
 But. A question remains. Where should we add these CSS variables? Should we add them in a stylesheet? Or directly to the `style` attribute of a particular element? And if we add them to a `style` attribute, which element should that `style` attribute belong too?
  
 We want the EventSequence to be in control of the content of these CSS variables: the developer should not populate these CSS properties with their own values. We don't have a real pseudo-class `:` to enforce such a rule, but we can say so with clear intent and expect this restriction to be respected.
 
 This means that we can choose either the `style` attribute or a stylesheet not expecting the properties to be overridden. And then we choose the `style` attribute, as it is the simplest to work with (creating a stylesheet element, and adding and removing it from the DOM as needed is neither simple nor efficient).
 
 If we add our custom CSS property to the root `<HTML>` element, the property will cascade down into the DOM to *all* elements. When the PseudoPseudoClass bubble, it will also be attributed to the root element. This means that bubbling PseudoPseudoClasses might trigger CSS rules a) from the root element that b) also need the PseudoCssVariable details from the root element. Thus, when the EventSequence needs its PseudoPseudoClasses to bubble, it also needs its PseudoCssVariables to be added to the root element.
 
 If the EventSequence only need to apply its PseudoPseudoClasses to the target, then it can also only add its PseudoCssVariable to the target. 
 
 Thus, we add our custom CSS properties:
  * to the `style` properties of either
  * the root element or the EventSequences target element.
 
 ## Implementation details about state details in CSS variables
 
 CSS variables are referable in the CSSOM: you can use them to fill or calculate values of your CSS properties in your CSS rules. In the CSSOM, the CSS variables cascade: add them to an element high up in the DOM, and it will trickle down to all the descendants of that element. This means that to get the "computed" value of a CSS variable, you cannot simply check the `style` attribute of that element to see what it is. No, you have to use `getComputedStyle(el)` to find it. Or?
 
 Weeeell, there is one exception. When a CSS property is added to the `style` attribute of an element, then that property will trump any other value of the same property that CSS ascribe to that element either by a rule or by cascade. The CSS properties specified in an element's `style` attribute is king, always. That means, that:
 1. if you *know* that a CSS property is added to the `style` attribute of an element, and 
 2. query that property from the DOM (ie. `el.style.getPropertyValue("--css-variable")`) instead of from the CSSOM (ie. `getComputedStyle(el).getPropertyValue("--css-variable")`), then
 3. you *know* that the DOM value *is the same* as the calculated CSSOM value would be. 
 
 This is *very helpful* for EventSequences that store their state data details as custom CSS properties in the DOM. The EventSequence:
 1. stores its state details as custom CSS properties in the DOM on either 
    1. the target (if the EventSequence PseudoPseudoClass does *not* bubble) or 
    2. the root element (if the EventSequence PseudoPseudoClass *do* bubble), and
 2. all the EventSequences' functions *know* which element the properties are added to, then
 3. all the EventSequences' functions can simply query the DOM via `targetOrRootElement.style.getPropertyValue("--css-variable")`.
 
 As long as the element targeted with the details of the state remains constant, the EventSequence can both store its details readily accessible in the DOM and make the same details referable as CSS variables in the CSSOM. And that is the best of both worlds.
 
 ## Demo: `--long-press-x`, `--long-press-y`, `--long-press-start`
 
 
 ## Summary
 
 With PseudoPseudoClasses and PseudoCssVariables, an EventSequence can reflect *all* relevant state data to the DOM:
 1. Such EventSequences hold *no deep state data*. 
 2. All functions in such EventSequences can efficiently access its state details via the DOM, (without having to call `getComputedStyle()`). 
 3. CSS rules can be a) triggered by the PseudoPseudoClasses and b) use the PseudoCssVariables directly. 
 4. JS functions from other context can read the EventSequences state.
 
 * The drawback of this approach is that there is no way to limit *write* access to the PseudoPseudoClasses and PseudoCssVariables. Only the EventSequences' internal functions should alter the PseudoPseudoClasses and PseudoCssVariables, but developers *can* do it from both HTML template and JS `classList.add()` and `style.setPropertyValue()` calls.
  
 ## References
 
  * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
  
