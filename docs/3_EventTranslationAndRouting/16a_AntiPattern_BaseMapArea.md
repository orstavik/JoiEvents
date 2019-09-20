# Pattern: HtmlEventSettings

## The peculiar imagemaps

To use HTML template to control an event seems very strange. However, there is a precedence: `<map>` and `<area>` (client-side image-maps). 

```html
<img src="chess.jpg" width="64" height="64" alt="chessboard" usemap="#chessmap" />

<map name="chessmap">
  <area shape="rect" coords="0,0,8,8" href="a1.html" alt="A1" title="A1">
  ...
  <area shape="rect" coords="56,56,64,64" href="h8.html" alt="H8" title="H8">
</map>
```

The `<map>` is an invisible grid with a set of specified `<area>`s that in essence adds a map of links to a single `<img>`. If no `click` (cf. `link="..."`) or `mousemove` (cf. `title="..."`) event occurs, then `<map>` and `<area>` are useless.

The use-case for such client-side image-maps is a bit dated. Back in the 90s, developers made website from large images that they a) cut up into smaller pieces, b) added a link to each piece, and then c) glued together in a `<table>` like a collage clientside. Yes, it was truly ugly. To simplify this process, the HTML 3.2 set up imagemaps. Imagemaps enabled the developer to send the entire image as a single piece and then add an imagemap to spread out different links across this single image. It was a step in the right direction, way back then.

## The peculiar `usemap` attribute

The `<map>` element is created outside of the `<img>` element. Instead, the `<img>` element references the `<map>` using a `usemap="map_name"` attribute. This `usemap` attribute is a bit tricky. Why don't the `<img>` just place the `<map>` element as a child, instead of using a weird `usemap` attribute that point to another `<map>` element far away in the DOM that has the same `name` attribute? Why add the complexity of an HTML-based, intra-DOM, element-attribute-to-attribute-element reference (here: ea2ae-reference)?

If anybody knows the historical answer to this question, I'd be glad to hear. But from an ahistorical, technical standpoint, the benefit of using the `usemap` reference is that *two or more* `<img>` elements can use *one and the same* `<map>` element.

This one-to-many `<img>` to `<map>` reference has several important consequences:

1. `<map>` elements are reusable. This potentially reduces boilerplate. And it can potentially reduce complexity. (If the reusable and encapsulated logic is truly independent from its context of use. Which, unfortunately, is not the case with `<map>`s.)

2. Because `<map>` elements are only active when they are referenced, their role is not defined by their position in the DOM, but by the position of the references to them. This breaks with the normal DOM structure in which an elements position matter. This makes `<map>`s function like meta elements, similar to `<script>`, `<style>`, `<link>`, and `<template>`.

3. It adds grammatical complexity to HTML. HTML elements already has a reference system: HTML elements reference each other *implicitly* by nesting elements inside each others' start and end tags. Everybody knows this one system, and it is used for almost everything. The `usemap` attribute comes outside this purity, and developers must therefore learn an extra grammatical concept in HTML to use it. There is a historical lesson to be learned here:

   1. How often do you think that `<map>` elements was actually referenced more than once inside the same HTML document, within the same DOM?
   2. How much worse is it to: a) have the exact same `<map>` boilerplate specified multiple places, or b) have to search through the DOM when you encounter a `usemap`?
   3. How many developers actually learned this second form of HTML reference? How many developers chose other alternative solutions than this one because they didn't quickly grasp the `usemap` concept?
   4. Even if a) all developers understood the concept immediately and b) `<map>`s was reused all the time, does that still justify having *two* instead of *one* grammatical means to make intra-DOM references?
   5. Once established, why wasn't the element-attribute-to-attribute-element intra-DOM reference put to use more? Why was `usemap` more or less the only attribute referencing other elements?
    
I suspect that if the image-map use-case was implemented today, it would be implemented in CSS. CSS "at-rules" such as `@keyframe {...}` or `@media {...}` both a) solve similar use-cases and b) echo the syntactical structure of `<map>` and `<area>`. CSS has expanded precisely to fill the gap into which `<map>` and `usemap` emerged.

But. What is the problem really? Are attribute-to-attribute references in HTML an inherently bad idea? Or is the problem that image-maps is a poor use-case for such references? Or, viewed inversely, are there other good use-cases for attribute-to-attribute references?

Yes. It actually is! And here is where the plot unfolds. There is one use-case where attribute-to-attribute references could be really useful: **event feedback**.

## Attribute-to-attribute for event feedback

Event feedback is for example visual queues, sounds, or vibration signals given the user to signal an event or gesture. A well known visual que is the mouse pointer, moving over the screen as you move the mouse and changing shape as it hovers different elements on screen. Audio feedback can be small "dings" or sharp "buzzes" as gesture succeeds or is canceled. And a small vibration can for example be given if the user presses a button for too long/long enough. In Chapter: EventFeedback we will look more in-depth into event feedback.

The best way to argue the case for attribute-to-attribute references in HTML as a good strategy to implement setting event feedback is to exemplify it:

## Demo: a `use-long-press-audio` attribute

This demo shows how a `use-long-press-audio` attribute can be used to make a `long-press` event make a sound when an element has been pressed long enough. The `long-press` event is set up as a composed event. It checks to see if the element being pressed has a `use-long-press-audio` attribute associated with it. If it has, the `long-press` event will find an `<audio>` element with an `id` whose value corresponds to the value of the `use-long-press-audio` attribute. It will then `.play()` this `<audio>` element when the element has been pressed long enough.

<pretty-printer href="./demo/long-press-settings-audio.js"></pretty-printer>

<code-demo src="./demo/long-press-settings-audio.html"></code-demo>
 
## Demo: a `use-long-press-symbol` attribute

This demo shows how a `use-long-press-symbol` attribute can be used to make a `long-press` event show a small animation that illustrate when the long press is active and when it has been pressed long enough. The `long-press` event is set up as a composed event. It checks to see if the element being pressed has a `use-long-press-symbol` attribute associated with it. If it has, the `long-press` event will find a `<template>` element with an `id` whose value corresponds to the value of the `use-long-press-symbol` attribute. The `long-press` event then shows this symbol on screen. For details about how visual feedback should be implemented, see Pattern: VisualFeedback in the next chapter.

```html
  <template id="long-press-visual">
    <style>
      @keyframes grow-circle {
        /*some animations*/
      }
      div {
        /*lots of style*/
        animation: grow-circle;
      }
    </style>
    <div style="border-radius: 50%; border-style: dashed;"></div>
  </template>

<div long-press long-press-visual="#long-press-visual">
  you could specify a custom visual feedback in this way
</div>
<div long-press long-press-visual="#long-press-visual">
  reuse it like so
</div>
<div long-press style="--long-press-visual: long-press-visual;">
  or specify it in HTML, and then reference it in CSS like so
</div>
```
 
## Why not attribute-to-attribute references?

1. Cascade. Can HTML attributes cascade? Or in this case, can the `long-press` event search from the target up the DOM to find the nearest ancestor element with a `use-long-press-audio` or `use-long-press-symbol` attribute? There are two answers.

   No. There is no precedence of cascading HTML attributes. Making an HTML attribute that *both* reference another element *and* cascade would be doubly off-kilter in HTML. It literally cries out for a CSS solution.
    
   Yes. The only other available example image-maps doesn't really benefit from the one-to-many structure that also could benefit from a cascading property. Why not simply state that this HTML attribute cascade?
   
   Here, we fall back on the old saying: "When in doubt, don't invent a grammatical structure."

2. The biggest benefit of the referencing a unit specified in HTML is declaring the `<audio>` and `<template>` elements in HTML. But, you don't need attribute-to-attribute to reference these declarations, you can just as easily reference them from JS. (To reference a DOM element from CSS as the value of a CSS property, to in this way bind that element to another DOM element would also be a grammatical invention. Thus, we avoid this too.) 
 
## References


todo

 But. Referencing the event settings via an HTML attribute is much more useful when it comes to other use-cases: namely `disable`, feedback etc.
