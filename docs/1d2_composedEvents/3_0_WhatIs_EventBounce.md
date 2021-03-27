# WhatIs: `Event` bounce?

The `composed` property describes how events **propagate between elements sorted under different `Document`s**, ie. in what order the event "visits" each node in the DOM during the different event phases.

In this chapter, we will look at three different models for how an event can propagate across shadowDOM borders: `composed: true`, `composed: false`, and `composed: bounce`. Of course, `composed: bounce` property doesn't exist. It is so far just a figment of our imagination. But. `composed: bounce` is very useful in order to understand complex event propagation. And. `composed: bounce` also promises to fix the world wide webs long huuuuge problem with both defaultActions, JS implementation of native elements, and the strange case of `FocusEvent.composedPath()`. So. We must at least start to talk about it.

## Demo: a `checkbox` in a shadowDom

We use the following demo:

```html
<check-box></check-box>
<script >
  class CheckBox extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<input type="checkbox">`;
    }
  }
  customElements.define("check-box", CheckBox);
</script>
```

When this is rendered, we see a simple checkbox on screen, the inner `<input type="checkbox">` inside the `<check-box>`. When we `click` on the checkbox, we *imagine* three different change events being dispatched: `composed-change`, `noncomposed-change`, and `bounce-change`.

All three change events are very similar: 
1. they are dispatched when the checkbox is toggled; 
2. they bubble; and 
3. they `target` the inner `<input type="checkbox">` element. 

The only difference between the three events is in their `composed` property:
* `composed-change` is `composed: true`.
* `noncomposed-change` is `composed: false`.
* `bounce-change` is `composed: bounce` (which is a hypothetical property here).

## The propagation of `composed: true`

The `composed-change` event is `composed: true`. This means that the event propagates across the borders between the main DOM and the shadowDOM of the `<check-box>` element. Therefore, when the `composed-change` is dispatched it will first be dispatched to the `window` node in the `capture` phase, trickle down the ancestor chain to the `<check-box>` host node, cross the shadowDOM border into the `shadowRoot` of the `<check-box>` element and then continue down until it reaches the `target` `<input type="checkbox">` element. The event will then bubble upwards, first to the `shadowRoot`, then cross the shadowDOM border to the `<check-box>` host node, and then bubble all the way up to the `window`. Straight down, and then straight up. All the way.  
    
```
The DOM         || 1.   | 2.   | 3.   | 4.   | 5.   | 6.   | 7.   
===================================================================
window          || cap1 |      |      |      |      |      | bub1
                ||      |      |      |      |      |      |
  check-box     ||      | cap1 |      |      |      | bub1 |  
-------------------------------------------------------------------
    #shadowRoot ||      |      | cap1 |      | bub1 |      |  
                ||      |      |      |      |      |      |
      input     ||      |      |      | tar1 |      |      |
```

If you call `e.stopPropagation()` in a `capture`-phase event listener in the upper, main DOM (e.g. step 2), then the event will not call any other event listeners (e.g. step >= 3), even thought these event listeners are a) in another DOM context and b) closer to the target.

The `composed: true` when it decides which event listener to call next:
1. EventPhase
2. Document
3. Element
4. Listener on element

## The propagation of `composed: false`

The `noncomposed-change` event is `composed: false`. This means that the event will not propagate across the borders between the main DOM and the shadowDOM of the `<check-box>` element. This means that the `noncomposed-change` will *not* start at the `window` node in the capture phase, but instead begin at the `shadowRoot` node of the `<check-box>` as this is the parent document for the `<input type="checkbox">` who the `composed: false` event is `target`ed at. Similarly, the propagation will also end at this node when the event `bubble` upwards.

```
The DOM         || 1.   | 2.   | 3.   | 4.   | 5.   | 6.     
==========================================================
#main dom       ||      |      |      |      |      |     
                ||      |      |      |      |      |     
  web comp      ||      |      |      |      |      |       
----------------------------------------------------------
    #shadowRoot || cap1 |      | bub1 |      |      |       
                ||      |      |      |      |      |     
      input     ||      | tar1 |      |      |      |     
```

`e.stopPropagation()` is very simple to understand in this case, as the event here only propagate in a single DOM context. If you call `.stopPropagation()` in step 1, then no event listener in step >= 2 will be called.   

The `composed: false` when it decides which event listener to call next:
1. EventPhase
2. Document
3. Element
4. Listener on element

One (important) thing to note about `composed: false` is that the priority order could be different. As *only one* `Document` is selected, the priority could just as easily have been:
1. Document
2. EventPhase
3. Element
4. Listener on element

## The propagation of `composed: bounce`

The `bounce-change` event has the hypothetical `composed: bounce` property. The `bounce` property uses the *alternative* propagation sequence mentioned above:
1. Document (bounce sequence)
2. EventPhase (as usual)
3. Element (as usual)
4. Listener on element (as usual)

> Bounce sequence is a little bit complex when it comes to slotted `Document`s in the propagation path, and we will discuss that in more details in the next chapter.

First, the `bounce-change` event propagets in the topmost outer `Document`. Here the `target` is the `<web-comp>` and `bounce-change` therefore propagates from the `window` down to `<web-comp>` and up again. This is the exact same event propagation sequence you would get if the innermost target was the `<web-comp>`.  

Second, the `bounce-change` event moves from the main `Document` to the shadowDOM `Document` of `<web-comp>`. Here, `bounce-change` propagates from `shadowRoot` to `<input type="checkbox">` and then up again, in the exact same sequence as in the example of `composed: false`.

```
The DOM         || 1.   | 2.   | 3.   | 4.   | 5.   | 6.     
==========================================================
#main dom       || cap1 |      | bub1 |      |      |
                ||      |      |      |      |      |     
  web comp      ||      | tar1 |      |      |      |       
----------------------------------------------------------
    #shadowRoot ||      |      |      | cap2 |      | bub2       
                ||      |      |      |      |      |     
      input     ||      |      |      |      | tar2 |     
```

Before we move on, we will add *two* additional *rules* for `composed: bounce`:
1. If you call `.stopPropation()` on a `composed: bounce` event, it will *only stop the propagation *within* the current `Document`, not anything else.
2. If you call `.preventDefault()` on a `composed: bounce` event, it will *stop* the execution of any event listener marked `preventable` in subsequent `Document`s, but *not* in the current `Document`.

## Demo: `bounce-change`

```html
<check-box></check-box>

<script >
  function getHostNodeTargets(target) {
    const targets = [target];
    let host = target.getRootNode().host;
    while (host) {
      targets.push(host);
      host = host.getRootNode().host;
    }
    return targets;
  }

  function log(e){
    console.log(e.type, e.eventPhase, e.target.tagName, e.composed, e.currentTarget);
  }

  function makeBounceEvent(name, dict){
    const bounceEvent = new CustomEvent(name, dict);
    bounceEvent.stopPropagation = function(){
      CustomEvent.prototype.stopPropagation.call(bounceEvent);
      bounceEvent.isStopped = true;
    };
    return bounceEvent;
  }

  class CheckBox extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      // const shadow = this.attachShadow({mode: "open"});
      shadow.innerHTML = `<input type="checkbox">`;
      const input = shadow.children[0];

      shadow.addEventListener("composed-change", log, true);
      input.addEventListener("composed-change", log);
      shadow.addEventListener("composed-change", log);

      shadow.addEventListener("noncomposed-change", log, true);
      input.addEventListener("noncomposed-change", log);
      shadow.addEventListener("noncomposed-change", log);

      shadow.addEventListener("bounce-change", log, true);
      input.addEventListener("bounce-change", log);
      shadow.addEventListener("bounce-change", log);

      input.addEventListener("change", () => {
        //1. dispatch composed-change
        input.dispatchEvent(new CustomEvent("composed-change", {composed: true, bubbles: true}));
        //2. dispatch noncomposed-change
        input.dispatchEvent(new CustomEvent("noncomposed-change", {composed: false, bubbles: true}));
        //3. dispatch bounce-change
        let bounceEvent = makeBounceEvent("bounce-change", {composed: false, bubbles: true});
        for (let target of getHostNodeTargets(input)){
          target.dispatchEvent(bounceEvent);
          if (bounceEvent.isStopped)
            break;
          bounceEvent = makeBounceEvent("bounce-change", {composed: false, bubbles: true});
        }
      });
    }
  }
  customElements.define("check-box", CheckBox);

  const checkbox = document.querySelector("check-box");

  window.addEventListener("composed-change", log, true);
  checkbox.addEventListener("composed-change", log, true);
  checkbox.addEventListener("composed-change", log);
  window.addEventListener("composed-change", log);

  window.addEventListener("noncomposed-change", log, true);
  checkbox.addEventListener("noncomposed-change", log, true);
  checkbox.addEventListener("noncomposed-change", log);
  window.addEventListener("noncomposed-change", log);

  window.addEventListener("bounce-change", log, true);
  checkbox.addEventListener("bounce-change", log, true);
  checkbox.addEventListener("bounce-change", log);
  window.addEventListener("bounce-change", log);
</script>
```

When we `click` on the checkbox, we get the following result:

```
composed-change 1 CHECK-BOX true window
composed-change 2 CHECK-BOX true CHECK-BOX
composed-change 1 INPUT true shadowRoot
composed-change 2 INPUT true INPUT
composed-change 3 INPUT true shadowRoot
composed-change 2 CHECK-BOX true CHECK-BOX
composed-change 3 CHECK-BOX true window

noncomposed-change 1 INPUT false shadowRoot
noncomposed-change 2 INPUT false INPUT
noncomposed-change 3 INPUT false shadowRoot

bounce-change 1 INPUT false shadowRoot
bounce-change 2 INPUT false INPUT
bounce-change 3 INPUT false shadowRoot
bounce-change 1 CHECK-BOX false window
bounce-change 2 CHECK-BOX false CHECK-BOX
bounce-change 2 CHECK-BOX false CHECK-BOX
bounce-change 3 CHECK-BOX false window
```

## References

 * 

