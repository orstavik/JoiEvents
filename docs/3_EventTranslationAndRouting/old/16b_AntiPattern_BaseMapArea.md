# Anti-pattern: BaseMapArea

## WhatIs: `<base>`, `<map>` and `<area>`?

`<base>` specifies the base for the browsers interpretation of any relative url's in the document. The browser uses this interpretation to perform own default, native tasks such as loading images and following links.

`<map>` and `<area>` is an old pair of HTML elements that:
 * from HTML template 
 * directs navigation events
 * that arise when the user `click`s on an area of an `<img>`.

```html
<img src="chess.jpg" width="64" height="64" alt="chessboard" usemap="#chessmap">

<map name="chessmap">
  <area shape="rect" coords="0,0,8,8" href="a1.html" alt="A1" title="A1">
  ...
  <area shape="rect" coords="56,56,64,64" href="h8.html" alt="H8" title="H8">
  ...
</map>
```

## What's: the problem?

`<base>` element could be a `base` CSS property. This would require the browser to call `getComputedStyle(...)` before loading resources, which could delay this process.

`<base>`, `<map>` and `<area>` are invisible. However, the DOM is a *document* object model, not a *view* object model, so this is not a problem. Lots of other elements such as `<script>` and `<link>` are invisible too, without necessarily being an antipattern.

And not very popular. And would if created today likely be implemented as CSS properties, not HTML elements. However, they illustrate how HTML elements can be set up whose sole purpose is to declaratively specify event behavior and event feedback (cf. the `title` attribute).

However, to use HTML elements directly to specify visual feedback of an event associated with an element would be slightly less strange than `<map>` and `<area>` which deal with invisible settings for the `click` event. After all, the HTML elements would be visible in certain cases. We can imagine the concept like so:

```html
<div long-press>
  <visual-feedback event="long-press">
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
  </visual-feedback>
  you can long-press on this element
</div>
```

But, this approach has a drawback. What if you have *two* `<div long-press>`s? What if some elements wished to reuse the same visual feedbacks, some of the time, while others not?

I suspect this is the reason the founding fathers in their new frontier experiments decided to *not* make `<map>` a child of the `<img>` element, but instead link `<img>` and `<map>` via the attributes `usemap` and `name`. Thus, to reuse the visual feedback element on several elements, the visual feedback element must be removed from the main DOM dimension and listed as meta elements on par with `<map>`, `<script>`, `<style>`, `<template>`, etc.

If such an approach were to be taken, the `<template>` tag with an `id` attribute would suffice. Elements needing to specify a custom long-press visual feedback could then simply use another HTML attribute or a CSS variable to reference it, like so:

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

Specifying custom event feedback in HTML `<template>` elements, and then reference that piece of template via HTML attributes or CSS properties, would be a good choice.

> Att! A problem with a custom CSS property such as `--long-press-visual`, is that it requires running `getComputedStyle()` on the initial event target element. This could accrue a performance penalty.
