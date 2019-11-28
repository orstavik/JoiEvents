# HowTo: Event composition

> todo rename old events to "OS Events" and "DOM Events" to just "events".

## What does it mean "to compose" HTML, JS, and CSS?

> "It's a beautiful thing, the Destruction of words. Of course the great wastage is in the verbs and adjectives, but there are hundreds of nouns that can be got rid of as well. It isn't only the synonyms; there are also the antonyms. After all, what justification is there for a word, which is simply the opposite of some other word? A word contains its opposite in itself. Take ‘good,’ for instance. If you have a word like ‘good,’ what need is there for a word like ‘bad’? ‘Ungood’ will do just as well – better, because it's an exact opposite, which the other is not. Or again, if you want a stronger version of ‘good,’ what sense is there in having a whole string of vague useless words like ‘excellent’ and ‘splendid’ and all the rest of them? ‘Plusgood’ covers the meaning or ‘doubleplusgood’ if you want something stronger still. Of course we use those forms already, but in the final version of Newspeak there'll be nothing else."
>
> 1984, by George Orwell

In web-speak, "to compose" means to combine stuff to make a web page. When you "compose" your web page, you must use a little HTML. And you do not *have to* use neither JS nor CSS nor any events to make a web page. So, strictly speaking, you can "compose" a web page using only HTML.

But, nowadays most web pages are small web apps. The web page include both JS and CSS and have events flying around like mad. So, when we "compose" a web page today, we think of it as combining HTML and JS and CSS with a bunch of events. So, "to compose a web page" today means more "to combine stuff written in HTML with other stuff written in JS with more stuff written in CSS with DOM Events" to make a functioning app.

So, when you hear someone talk about "composing" something on the web today, think of it as the act of "combining HTML with CSS, JS, and/or DOM Events" to make something. Try to avoid to use the term "compose" about simply writing something in HTML, CSS or JS when you think of this text in isolation. Use "compose" when you want to highlight that your HTML template, CSS rules or JS code is oriented towards each other.

> to "compose": "put together". For more, google "etymology position" and "etymologi compose".

## Events: the fourth power

Exactly what role does events such as `click`, `offline`, and `mousemove` play in a web app? Are they part of the DOM, like neurons that communicate messages between DOM elements? Are they part of JS, a simple module in a programming language? And what about CSS and events, are they related, or are they just a friend of a friend?

These questions has an answer. Events are not subjugated neither HTML nor JS; they are *independent of* both HTML, JS, and CSS. But. Events does not live in isolation. Events occur in a world co-inhabited by HTML, JS, and CSS. It is the fourth power of the web run-time universe.

This perspective might confuse you. How can we have events if there are no HTML elements for them to associate, or no JS functions to react to them? How can there be a sound of a tree falling in the forrest, if there are no trees (of HTML elements) and no one there to her it (JS event listeners)?

Because. There is a difference between "an underlying event" and its "mediation in the browser". For example:

* If we create an empty DOM, with only a `window` and `document` elements, then we can still have lots of `mousemove` and `click` events. Even if we took away the DOM completely, the `click` would still occur in the OS. And when a user tries to `tap` on his smartphone in the mid of winter, not registered by the frozen hardware at all, somewhere in the mind of the user and IRL, a `click` still occured.

* Events have consequences, even when no JS functions perceive them. The `defaultAction` of link-click-navigation, drop-down-select, swipe-to-scroll works fine without JS.   

* Some events (an JS functions) works *outside* the DOM. `window.addEventListener("offline", alert("Panic attack!"));` does not rely on any DOM elements to work (if you can accept that I don't include the `<script>` tag that holds the JS function in this equation). 

And. Events also have a separate, direct, two-way relationship with CSS:

* Some events are directly controlled from CSS. The CSS properties such as `touch-action` and `user-select` are events controlling directives from CSS. 

* Some events can directly control CSS. The `mouseover` event turns on/off the CSS selector `:hover` on DOM elements.

Sure, most of the time, events makes a lot more sense (and sound) when there is a rich DOM with JS functions listening to them. And sure, mostly events and CSS are just friends of friends, interacting indirectly via HTML or JS. But. Events are still its own master, neither subjugated HTML nor JS, nor cut-off from CSS.

## HowTo: compose with events?

When we "compose" a web app, we mix four main ingredients: HTML, JS, CSS, and events. But, to add some *precision* to this cookbook, we can break down the exactly *seven* ways to "compose" with events:

1. JsToEventComposition: JS functions create, alter or destroy events.
2. EventToJsComposition: events direct JS functions.
3. HtmlToEventComposition: HTML elements create, alter or stop events.
4. EventToHtmlComposition: events alter the state of HTML elements.
5. CssToEventComposition: CSS rules direct or block events.
6. EventToCssComposition: events activate CSS rules.
7. EventToEventComposition: events create, alter or stop other custom events.

In the first chapter of this book we briefly discuss composition method 1-6: how events can be put together with JS, HTML, and/or CSS. Chapters 2-8 of this book, we devote to EventToEventComposition(7).

## Special price for you my friend! ;)

EventToEventComposition is a truly powerful strategy for web architecture. In web apps today, both a) problems of code bloat and complexity and b) cognitive barriers to advanced functionality actually arise from poor archicture for EventToEventComposition. 

In fact, I believe that EventToEventComposition holds more promise of making web app modules a) simpler and b) reusable than *any other technique*, including TypeScript, web components, and functional programming/immutable state management.
 
In this book, I aim to prove this statement. And convince you. I aim to show you problems you *know* very well, but havn't really *seen* before. I aim to *share* an architecture strategy that feels both familiar and eye-opening that truly simplifies your code. And I aim to present patterns you can apply directly to *consume* (and produce) new *reusable* modules of code, today. 

The end result I hope will be that you can cognitively envision and maintain more powerful and complex systems. I hope that simplicity of code will produce beautiful code. And richer web apps. I hope that open, thorough discussion about modularization strategies and techniques will yield a better shared understanding when developers share and consume each others code, a more trustworthy open-source environment. And I hope that all this will promote the open web, enable it to thrive not only among expert developers, but also ordinary users. Yes. [Panacea!](https://en.wikipedia.org/wiki/Single-payer_healthcare)

But first, let's look at *how* and *why* events interact with HTML, JS, and CSS.

## References

 * 