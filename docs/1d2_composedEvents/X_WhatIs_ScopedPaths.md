# WhatIs: ScopedPaths?

Scoped paths is a acyclic graph with the propagation path of a composed: true or false event broken into segments for each array, in the sequence they should propagate. A slotted event should propagate midway during the propagation of its ancestor event. The slotted event propagates between the event listeners being called on the slotted node and the event listeners being called on the host node in the lightDOM.

Because the event listeners in the slotted event must be called midway during the event propagation of the lightDOM event, then I think the propagation of bounced events must be completely async. If not, it would be difficult to get the defaultAction object out of the bounced event.

```javascript
  function getScopedPathsComposedTrue(target) {
    let innerRes = getScopedPathsComposedFalse(target);
    const res = [innerRes];
    while (target = innerRes[innerRes.length - 1]?.host)
      res.push(innerRes = getScopedPathsComposedFalse(target));
    //todo should we return the upper bounced path as a flat array? or not? This will yield a different graph structure in different settings?
    return res;
  }

  function getScopedPathsComposedFalse(target) {
    const path = [];
    const firstTarget = target;
    while (target) {
      if (target.shadowRoot && firstTarget !== target) {  //we don't check on the first run
        const slotName = target.getAttribute("slot") || "";
        const slot = target.shadowRoot.querySelector(!slotName ? "slot:not([name]), slot[name='']" : "slot[name=" + slotName + "]");
        slot && path.push(getScopedPathsComposedFalse(slot));
        //else return path; //todo this is an edge case that could tip in different directions. The browser will run the lightDOM path. It is a question if that is the right thing to do...
      }
      path.push(target);
      if (target instanceof ShadowRoot)
        return path;
      if (target === document) {
        path.push(window);
        return path;
      }
      target = target.parentNode;
    }
    return path;
  }

  function toScoped(path) {
    if(!(path instanceof Array))
      throw new Error("toScoped argument must be an array.");
    const res = [];
    for (let i = 0; i < path.length;) {
      [i, innerRes] = toScopeImpl(i, path);
      res.push(innerRes);
    }
    return res;
  }

  function toScopedImpl(i, path) {
    const res = [path[i++]];
    for (; i < path.length; i++) {
      const target = path[i];
      if (target instanceof HTMLSlotElement) {
        [i, innerRes] = toScopeImpl(i, path);
        res.push(innerRes);
      } else if (target instanceof ShadowRoot) {
        return [i, path];
      } else
        res.push(target);
    }
    return [i, res];
  }
```

```html



```