# Pattern: PseudoCssVariables

But, the `long-press` EventSequence also needs to store its duration and position. This state data is needed by *both* subsequent trigger functions in the EventSequence *and* CSS rules for EventSequence feedback elements. Thus, this data should also be reflected in the DOM, but as CSS variables so that they may be used in other CSS properties.

Furthermore, for EventSequences that do not bubble and that only adds its PseudoPseudoClass to its target, these CSS variables should also be added to the target. However, EventSequences that bubble and which adds its PseudoPseudoClass all the way to the root element, should add these CSS variables to the root element. All elements which might benefit from being associated with the PseudoPseudoClass might also potentially benefit from the CSS variables contained EventSequence state data.

> CSS variables is a better alternative than HTML attributes for this purpose. HTML attributes do not cascade in the DOM/CSSOM, while CSS variables do (in the CSSOM). Furthermore, the CSS `attr()` function does not work, making the value of HTML attributes basically inaccessible for direct inclusion and reference in CSS property values, whereas CSS variables and `var()` work well for this purpose.

When subsequent trigger function needs to read state data stored as CSS variables, they do not need to call `getComputedStyle()`. The EventSequence functions know full well on which element's style property object the CSS variables have been added, and can query and parse this DOM object directly, without needing to go via `getComputedStyle` and recalculating the CSSOM.

Using PseudoPseudoClasses and PseudoCssVariables, the EventSequence can reflect *all* relevant data to the DOM. This means that the EventSequence holds *no deep state data*, and that all the data from the EventSequence is accessible from *both* other JS contexts *and* CSS selectors and properties.

## Demo: `--long-press-x`, `--long-press-y`, `--long-press-start`

 
## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)