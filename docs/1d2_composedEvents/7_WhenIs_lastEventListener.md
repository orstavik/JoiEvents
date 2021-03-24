# WhenIs: last event listener called?

## lastPropagationTarget

If `e.stopPropagation()` and `e.bubbles = false` is blocked, then this function will find and return the last node on which event listeners will be called.

```javascript
function lastPropagationNode(event) {
  const path = event.composedPath();
  if (event.bubbles) return path[path.length - 1];
  if (!event.composed) return path[0];
  //non-bubbling and composed
  //We iterate top-down until we either hit a shadowRoot, or the bottom
  let top = path[path.length - 1];
  for (let i = path.length - 2; i >=0; i--) {
    if (path[i] instanceof ShadowRoot)
      return top;
    top = path[i];
  }
  return top;
}
//todo untested
```

This is not in conflict with mode-closed restrictions, as the topmost hostNode is visible in all scopes.

## old discussion, pre stopStopPropagation().

A postPropagation callback for composed: true events would require a twostep event listener:

1. first an unstoppable event listener would be called upon inside the shadowDOM. This event listener would then add another event listener on the window bubble phase that would also be unstoppable. The added event listener should have a lexical scope to read the properties from the closed shadowDOM.

If this is universally available, this solves the problem of This has the benefit of being able to implement a last option for defaultAction. Instead of using EarlyBird, we implement a PostPropagationCallback..

No, i should call them prePropagation postPropagation prePrePropagation And do so in the next chapter.

This means that we can implement the addEventListener options as defaultAction and EventController.. This simplifies the interface a lot.. Then you just add defaultActions and EventControllers as regular event listeners anywhere, except that they are marked with "eventcontroller: true" or "defaultaction: true"..

slight reduction in StopPropagation speed vs. increased speed of the defaultAction task. Using event listeners is much less heavy than using toggleTick. And... how speed sensitive is addEventListener and stopPropagation() really??

## References

* (discussion about closed shadowDOM intention)[https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975]