# Pattern: TypedEvent

The TypedEvent trigger composed events for specific types of elements. Whenever a trigger event occurs, a TypedEvent will check the target chain to find a suitable element type for its composed event. If it finds such a target, it will proceed; if it does not, it will simply quit.

## Implementation

todo find the function that allows for shadowRoot in the target chain.

The method thus looks like this:

```javascript
function filterOnType(e, typeName) {
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === typeName)
      return el;
  }
}                            
```

## Example: `link-click` with TypedEvent

TypedEvent pattern can separate `click`s on links from `click`s on any other element. When the user clicks on an element within a page and that element is a child of a `<a href>`, that click will trigger the browser to navigate. However, if the clicked element is not a child of a link, then the event will not trigger a link click. To have a custom event that always trigger if the user clicks on a link thus gives us a simple, efficient way to intercept all link clicks. Below is a naive implementation of such a TypeFiltered PriorEvent `link-click`:

<pretty-printer href="./demo/link-click-TypeFiltered.js"></pretty-printer>

## Demo: `link-click` with TypeFilter

In the demo below we use `link-click` to control navigation. It is a micro router: a router that can block or let pass to different navigation events.

<code-demo src="./demo/link-click-TypeFiltered.html"></code-demo>

## References

 * 
                                                                            