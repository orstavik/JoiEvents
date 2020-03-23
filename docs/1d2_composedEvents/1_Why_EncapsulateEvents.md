# Why: encapsulate events?

## Short intro to DOM contexts

With web components the DOM is broken into multiple contexts which doesn't care about each other:

1. **main DOM context**. The main DOM is the "normal DOM" that "normal" web developer makes. It is the topmost `document`. It is the app's HTML that is changed by the app's javascript.

2. **shadowDOM contexts**. ShadowDOM are small pieces of DOM inside web components (and native elements) that contain their own, separate HTML, JS, and CSS. These small pieces of DOM are nested inside the main DOM and inside each other, both when elements are slotted and when  elements are used directly inside the shadowDOM of another element. In the context of (reusable) web components the shadowDOM do not know the context of neither the main DOM, nor each other, and vice versa. When you make or use web components, your DOM gets filled with other developers DOM contexts that you neither know about and that "should just work".

   The shadowDOM contexts are the inside of an HTML element. The inside of an element is made up of other HTML elements, some added CSS style and some custom JS properties, methods, and reactions. If you analyze a piece of HTML template to its roots, you would break it down into layers upon layers of shadowDOM with gradually simpler elements with some CSS and JS until you end up with a shadowDOM that only contain simple `<span>` elements with some added JS and CSS. More or less.
   
## Why shadowDOM?

Now, it is obvious that we want to hide away these itsy-bitsy pieces of inner HTML structure,  javascript, and CSS code in the shadowDOM of a native element. First, it would be impossibly complex if web developers had to work only with the low level `<span>` elements and lots of CSS and JS code. Second, we want to encapsulate in structure, layout, and functions of many different elements to prevent styles, functions and structures from mixing up. For example, it is good to not expose all the template, functions, and style of the control panel in a `<video>` element, as it would both swamp the code where the `<video>` element is used and potentially leak both in and out style and functionality. The whole point of web components and HTML elements is this: to hide generic stylistic, structural and functional details to prevent them from confusing the developer and get their references mixed up with the rest of the code where it is used. *The purpose of web components (and native elements) is to encapsulate HTML, CSS, and JS*.  

But, we forgot one thing! We forgot that we also want to **encapsulate internal events**. Web components (and native elements) can have lots of events flying around inside their shadowDOM that are internal details, that has nothing to do with the elements outside. It can be just as important to hide and shield internal events as it is to hide and shield internal style and functionality. Some events therefore needs to be contained inside the shadowDOM context, while other events should be able to fly between shadowDOMs. We do not want the inner event sequences of an element to bleed out from an element (and we don't want irrelevant outer event sequences  to bleed into an element's insides neither). *The purpose of web components (and native elements) is to encapsulate HTML, CSS, JS, **and events***.  
 
## In this chapter:

1. WhatIs: `composed` events? 
1. BounceEvent: a pattern for making `composed: false` "bounce up" and propagate in the above lightDOM when necessary. 
2. Problem: Why should the `submit` event be `composed: true`?
3. Problem: Why should `beforeinput` and `input` events be `composed: false`?
4. Problem: Why do focus events sometimes behave as though they are `composed: false`, when they are always `composed: true`? Are focus events in reality automatically bounced by the browser?
5. Problem: Why should `composed: false` events *not* propagate down into "lower shadowDOMs"? Should nodes in the propagation path that do not have the same document root as the `target` be removed from the propagation path of `composed: false` events?

    
## References

 * 