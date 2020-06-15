# WhatIs: BouncePaths?

Bounced paths is a acyclic graph with the propagation path of a composed: true event broken into segments for each array, in the sequence they should propagate. A slotted event should propagate midway during the propagation of its ancestor event. The slotted event propagates between the event listeners being called on the slotted node and the event listeners being called on the host node in the lightDOM.

Because the event listeners in the slotted event must be called midway during the event propagation of the lightDOM event, then I think the propagation of bounced events must be completely async. If not, it would be difficult to get the defaultAction object out of the bounced event.

```javascript
function bouncedPaths(composedPath){
  const path = new Array(composedPath);
  const res = [];
  while(path.length)
    res.push(bouncedPathsRecursive(path)); //mutates path
  return res;
}            

function bouncedPathsRecursive(path){
  const res = [];
  for (let i = 0; i < path.length; i++) {
    let el = path[i];
    if (el instanceof HTMLSlotElement)
      res.push(bouncedPathsRecursive(path));
    res.push(el);
    if (el instanceof ShadowRoot)
      return res;
  }    
  return res;
}
``` 

```javascript
function getBouncePath(target, res) {
  res = res || [];
  const path = [];
  res.push(path);
  while (true) {
    path.push(target);
    const shadowRoot = target.parentNode.shadowRoot;
    if (shadowRoot){
      const slotName = target.getAttribute("slot")|| "";
      target = shadowRoot.querySelector(!slotName? "slot:not([name]), slot[name='']":"slot[name="+slotName+"]");
      continue;
    }
    if (target.parentNode) {
      target = target.parentNode;
    } else if (target.host) {
      if (!composed)
        return path;
      target = target.host;
    } else if (target.defaultView) {
      target = target.defaultView;
    } else {
      break;
    }
  }
  return res;
}
```

```html



```