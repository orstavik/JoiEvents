# HowTo: Control events using HTML attributes?

Event controllers use the DOM to control interpretation of the events. And, it reads specialized HTML attributes placed in the DOM to do so:
1. turn on/off particular event controllers, such as `draggable="true"`, and
2. guide an ongoing actions of other event controllers, such as `tabindex="1"`.

But there is a problem. It is unclear how these attributes should be interpreted?

## Problem: `draggable="true"` is a tyrant 

`draggable="true"` is an HTML attribute you can place on an element to make it drag'n'drop-able. Some elements such as `<img>` are draggable by default, but most HTML elements must be given this HTML attribute to do so. Similarly, if the propagation path does not contain any draggable elements, then the browser will not trigger any drag events neither. 

But, what if the event propagation path *two* elements that were `draggable="true"` and `draggable="false"`. Does `draggable="false"` always trump `draggable="true"`, or vice versa? Or should the browser look to the attribute **nearest the target**? Put simply, does the HTML `draggable` attribute cascade?

```html
<div>
  <div>outer nothing, inner nothing</div>
</div>

<div draggable="true">
  <div>outer draggable=true, inner nothing</div>
</div>

<div draggable="false">
  <div>outer draggable=false, inner nothing</div>
</div>

<div draggable="true">
  <div draggable="false">outer draggable=true, inner draggable=false</div>
</div>

<div draggable="false">
  <div draggable="true">outer draggable=false, inner draggable=true</div>
</div>

<script>
  window.addEventListener("drag", console.log);
</script>
```
## Discussion

Viewed in HTML, the above result is *both* surprising and disappointing: if `draggable="true"` is set anywhere in the propagation path, the browser will try to convert mouse events to drag events. It doesn't matter if you *nearer the target* or at the top of the DOM set `draggable="false"`, it will not override it. As long as there is a `draggable="true"` in the propagation path, it will drag. And that is not very HTMLish. 

## WhatIf: `draggable` attribute was a `<draggable>` element?

nothing much would have changed. 

Again, this is not easy to discern. It seems outside the normal patterns for DOM behavior. Why does not the browser decide "draggability" reviewing the propagation path bottom-up, following the *nearest target* principle?

The clear answer is that "it should have". The DOM hierarchy structure means something. Developers are likely to read into this structure the meaning that the attribute set nearest the target should be the preferred value for the event controller function. A semantic rule that if one ancestor is `draggable="true"`, all of its descendants are `draggable="true"`, not matter how many `draggable="false"` you throw in between, is.. semantic ugliness. We have beautiful grammatical rules from both CSS and HTML and event propagation, we should lean on them instead.      
