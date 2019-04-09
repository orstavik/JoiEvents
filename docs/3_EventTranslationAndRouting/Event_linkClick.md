# Event: `link-click`

## Filter all link type elements

The chapter on TypeFilteredEvent pattern illustrates how we can filter link clicks on `<a>` elements.
However, there are two other link elements that can be `click`ed in an HTML page:
`<area>` (with nodeName "AREA") and inline SVG `<a>` elements (with nodeName "a").
In addition, a `click` will not navigate if a `metaKey` was pressed at the same time.
We therefore add this to our filter method, which therefore is best customized for this 
particular setting.

```javascript
function filterNavigationTargets(e) {
  if (e.metaKey)
    return;
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === "A" || el.nodeName === "AREA" || el.nodeName === "a")
      return el;
  }
}                            
```

## Full `getHref()` method

As in all things defaultAction and browser navigation, nothing is simple and without edge-cases.
The problem with `link-click`s is that early on, the browsers did not implement very clean logic.
But, still people used it. They had little choice. And thus today, these dirty little secrets still
linger around the platform and require our attention and support from time to time.

Two such dirty little secrets concern getting the actual `href` value that a browser will navigate to.
You are likely very rarely going to encounter these edge-cases anymore, but as you might happen to be so
unfortunate or careless, it is best to ensure that ones custom, composed events do handle them properly.
That way, you can solve them once and for all in a custom, composed event! (Hehehe, yes, you got me! 
I am slightly overselling the point here;)

Dirty little secret number one is: the link string value of an SVG `<a>` being clicked is 
its `.href.animVal`, and not just its `.href` property.

Dirty little secret number two is: if you click on an `<img ismap>` element inside a `<a href>` element,
then the offset x and y value of the pointer when you clicked it will be added as a suffix to the end
of the link on the form of "?x,y".

That is it. As with all dirty little secrets, they are not so bad you get them all out in the open.
`<a href>` has been around a little, but it wasn't as bad as you had feared. Phuu!

So, in order to properly `getHref()` from a `link-click`, we need to update the function that retrieves 
it slightly. Here is a pure function that illustrates it:

```javascript
function getLinkHref(link, click){
  //dirty little secret nr 1: SVG
  if (link.href.animVal) 
    return link.href.animVal;    
  //dirty little secret nr 2: <img ismap>
  if (click.target.nodeName === "IMG" && click.target.hasAttribute("ismap"))
    return link.href + "?" + click.offsetX + "," + click.offsetY;        
  return link.href;
}
```

## Event: Complete `link-click` ES6

When we combine the PriorEvent, EarlyBird, TypeFilteredEvent and DetailsOnDemand patterns with the
edge cases above, we get the following custom, composed `link-click` DOM Event.
This `link-click` event takes much of the headache out of controlling the template based navigation.

<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/link-click.js"></pretty-printer>

## Demo: `link-click` 

In the demo below we use `link-click` to control navigation. It is in a sense a micro, binary router, 
a router that blocks or let pass different navigation events.

<code-demo src="demo/link-click.html"></code-demo>

## Discussion: `link-click`, `preventDefault()` and PriorEvent

The `link-click` event is a prime example of why and when the PriorEvent pattern is needed.
If the developer wishes to control the navigation behavior of the browser's DOM, this particular event 
(in addition to `submit`) needs to be intercepted and controlled.
PriorEvent is the only pattern that allows a developer to both create a custom, composed event that 
filters out all the relevant "navigation events" and then *selectively block* such navigation events
(cf. PriorEvent, AfterthoughtEvent and ReplaceDefaultAction).

If you really cannot stand the composed event propagating before the trigger event, 
there is one other alternative: The replaceDefaultAction pattern could be employed, 
and then once the developer wishes to let navigation events bypass, a new `<form>` element with 
the correct `href` and `method="get"` could be created and then called `.submit()` upon. 
However, this is a far more complex solution than the PriorEvent pattern.
I consider the drawback of reverse propagation order to be less than the potential bugs that could 
arise from the composed event before the trigger event.

## References

 * 