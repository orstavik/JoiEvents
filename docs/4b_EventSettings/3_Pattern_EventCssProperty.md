# Pattern: CssEventSettings

## Controlling native events from CSS

Several CSS properties control native events and gestures:

1. `cursor`: changes the icon of the mouse cursor when it hovers an element. This CSS property control the (visual) feedback for an event.
2. `pointer-events` and `touch-action`: enable the developer to control the propagation and actions of pointer and touch events. These properties control the behavior for an event. 
3. todo add more examples?? 

> CSS pseudo-classes such as `:hover` and `:visited` also interact with events to control the style of elements. But, as pseudo-classes cannot yet be custom made, we only focus on CSS properties in this chapter. 

## When to decide in an EventSequence?

> todo this section is about event control.

Native EventSequences make their decisions up front. For example, *before* the `touchstart` event begins to propagate, the value of the `touch-action` and `pointer-action` is a) read by the browser and b) fixed. This means that if `touch-action` did allow `scroll` before the `touchstart` event was dispatched, then setting `touch-action: none` in a `touchstart` event listener will not immediately stop the scrolling.

This is limiting. The native EventSequences touch-drag-to-scroll uses the CSS properties `touch-action` and `pointer-action` to specify its behavior. Thus, if you wanted to alter the behavior of this EventSequence while it is going on, for example in a `touchstart` event listener, the most natural thing to do would be to change these controls. Right? So why is the native EventSequence *ignoring* my changes to these CSS properties until the *next* EventSequence?

There is a practical reason for this decision. CSS properties such as `touch-action` can a) be delegated to an element via various CSS rules from different stylesheets, and b) will also propagate down from ancestor elements if not specified directly on the element by a rule or in the `style` attribute. This means that to find out what the `touch-action`, the native EventSequence must check the CSSOM value of the CSS property on the element, it cannot simply check the `style` property of the DOM element: it must call `getComputedStyle()`. And this takes time. Now, to do this efficiently, the browser ensures that it processes the start of native EventSequences that needs to check such settings from CSS (ie. `touchstart`) right after it has already calculated the CSSOM. But, querying the CSSOM is still costly, so the browser does not read these CSS properties for all the secondary event triggers. Thus, to stay fast, the browsers read the CSS settings for its native EventSequences *once*, at the very beginning of the EventSequence, and then sticks by these same settings until the current EventSequence ends. 

Why make decisions up front :        

1. By making decisions up front early in the initial event trigger function, an EventSequence can reduce its workload. By making a decision up-front, the EventSequence might
   1. avoid even registering secondary trigger event functions, and
   2. avoid computing a property or premise during secondary event trigger function calls.
   
2. By making a decision early and then sticking to it, the EventSequence becomes much more predictable. There will be no change of heart between the initial and secondary custom DOM Events. Fewer property values dancing around.
   
3. By making a decision in one time, in one place in the code, gives a clear entry-point for debugging the EventSequence.

## Controlling custom, composed events from CSS

Custom CSS properties can be used to control custom, composed events. For example can the required duration for a `long-press` event be set on specific elements using a CSS variable: `--long-press-duration: 500ms`. 

The benefit of using CSS properties to specify such properties are many:

1. Because CSS custom properties cascade down the DOM, applying the same properties to many different elements and events is easy. 

2. Because CSS properties can override each other, it is easy to specify different properties for different elements. 

3. Because CSS rules can be turned on/off depending on DOM state (ie. CSS classes and HTML attributes), the event settings can declaratively be adapted to the state of the DOM.

4. Controlling behavior of events, gesture, and UX is tightly related with the overall design of the web app. Thus, controlling event settings from CSS makes it easier for designers to work with UX along side the visual estethics of the app.

## When not to control events from CSS properties

CSS properties mainly work for choosing between pre-existing template or specifying a numeric value. The `cursor` and `pointer-events` are good examples of CSS properties that let you *choose* between a set of fixed alternatives. The `--long-press-duration` property is a good example of how numeric values can be set in a CSS property. 

But, syntactically, CSS properties are very limited. You can't (shouldn't) write long stories as a CSS property value. But, what if you need to write long storied? What if you need to specify a more complex visual feedback, that simply providing a URL to an image or choosing an icon from a list doesn't work?

This is where CSS properties falls short. And we can see this problem in action by considering `content: "some text"` applied to `::before` pseudo-element. The `content` property is both very *limited* (it only allows text content) and *messy* (conceptually, CSS comes *after* HTML template, and thus should not itself *add* HTML template or text to the DOM). This makes CSS properties a bad strategy if the developer wishes to for example add complex custom visual feedback or control event behavior granularly.

Another problem with CSS properties is that... event control in CSS is a strange mix for many. Even though designers might see events from the perspective of CSS, most developers view events from a JS perspective. They see the control of events as imperative operations done inside JS event listeners, not as declared states in CSS. This is of course neither true nor false. But it counters the argument that CSS, and not JS, is the "natural home" of event control.

## Issues implementing CssEventSettings

To read a CSS custom property from within a composed event gives us some concerns:

1. CSS properties cascade and override each other. Thus, we must find the *computed* value of the CSS property from the CSSOM, we can't simply read the `style` attribute on the element. And to do so, we must use the costly `getComputedStyle(targetElement)`.

2. Composed events needs to be processed synchronously (cf. the PriorEvent and AfterthoughtEvent patterns). Thus, we *cannot* postpone calling `getComputedStyle()` until the next `requestAnimationFrame()` to lessen the burden of CSSOM calculations.

3. Instead, the CSS properties that control a native gesture are only read only *once* during each event sequence. This policy is applied to native event control too: for example are `pointer-events` and `touch-action` read only once at the touch or mouse gesture's initial event and then fixed until the gesture ends(; todo check if this applies to `cursor` too). The drawback of this policy is that CSS properties cannot control an event *in-flight*: ie. if you set `touch-action: none` from within a `touchstart` event listener, it will still scroll and pan or do whatever as the `touch-action` CSS property was read by the browser *before* the `touchstart` event started propagating.

4. If you need to read more than one CSS setting, you should read them all at once. Reading different CSS settings at different times during the event sequence will cause lots of CSSOM re-calculations and potentially create strange race-conditions.

5. For a few simple combinations of event sequences and event settings, it is possible to read the CSS property at the end of the event sequence, and not up front. However, this can cause confusion as most event settings are read up front. My advice in such scenarios is:

   If you can delay calling `getComputedStyle()` until a later point, I generally recommend that you do so. But, with composed events, you should expect that other event settings might appear around the bend, and that they will force you to move your call to `getComputedStyle()` up front. If you by that time have made code that for example alters the CSS event settings *after* the gesture/event sequence has been initialized, your code will break. Thus, always expect CSS event settings to be read up front, and it is for that reason not wrong to always do so.
 
## Demo: `--long-press-duration`

In this demo we will control the time a user has to press on an element with a mouse for a naive `long-press` event to occur using a custom CSS property `--long-press-duration`. The `--long-press-duration` is expressed as either `ms` or `s`. A negative value will turn `long-press` off.

<pretty-printer href="./demo/long-press-settings-css.js"></pretty-printer>

<code-demo src="./demo/long-press-settings-css.html"></code-demo>

## References
