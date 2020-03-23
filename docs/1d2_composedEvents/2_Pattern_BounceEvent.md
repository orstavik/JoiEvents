# Pattern: BounceEvent

In this chapter, we will look at three different models for how an event can propagate across shadowDOM borders: `composed: true`, `composed: false`, and `composed: bounce`. Of course, there is no such thing as a `composed: bounce` property, but here we will pretend there is and describe how it could/should work.

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

When this is rendered, we see a simple checkbox on screen, the inner `<input type="checkbox">` inside the `<check-box>`. When we `click` on the checkbox, we imagine three different `change` events being dispatched: `composed-change`, `noncomposed-change`, and `bounce-change`. All three events are more or less the same: they are dispatched when the checkbox is toggled; they bubble; and they `target` the inner `<input type="checkbox">` element. The only difference between the three events is in their `composed` property:
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

If you call `e.stopPropagation()` in a `capture`-phase event listener in the upper, main DOM (e.g. step 2), then the event will not call any other event listeners (e.g. step 3+), even thought these event listeners are a) in another DOM context and b) closer to the target.   

## The propagation of `composed: false`

The `noncomposed-change` event is `composed: false`. This means that the event will not propagates across the borders between the main DOM and the shadowDOM of the `<check-box>` element. This means that the `noncomposed-change` will *not* start at the `window` node in the capture phase, but instead begin at the `shadowRoot` node of the `<check-box>` as this is the parent document for the `<input type="checkbox">` who the `composed: false` event is `target`ed at. Similarly, the propagation will also end at this node when the event `bubble` upwards.

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

`e.stopPropagation()` is very simple to understand in this case, as the event here only propagate in a single DOM context.   

## The propagation of `composed: bounce`

The `bounce-change` event has the hypothetical `composed: bounce` property. The `bounce` property specifies that the event propagation is completed in the inner DOM context first, and then runs completely on the outer DOM context, recursively.

As the `bounce-change` event `target` the `<input type="checkbox">` that is an element located in the shadowDOM of the `<check-box>` element, the `bounce-change` event will therefore first propagate down from the `shadowRoot` to the `<input type="checkbox">` and then up again to the `shadowRoot`, as if it were `composed: false`.

But, once the `bounce-change` has finished propagation in the inner shadowDOM document, then it will "bounce up" to the DOM context of the host node. And in this upper DOM context, it will be re-dispatched and here `target` the `<check-box>` host node. Again, the `bounce-change` event will propagate as if it were `composed: false` in the upper context also. And, if shadowDOMs are nested more than two levels, this process would simply recurse in the same way, one bounce per host node.   
 
```
The DOM         || 1.   | 2.   | 3.   | 4.   | 5.   | 6.     
==========================================================
#main dom       ||      |      |      | cap2 |      | bub2
                ||      |      |      |      |      |     
  web comp      ||      |      |      |      | tar2 |       
----------------------------------------------------------
    #shadowRoot || cap1 |      | bub1 |      |      |       
                ||      |      |      |      |      |     
      input     ||      | tar1 |      |      |      |     
```

Calling `stopPropagation()` on a `composed: bounce` event will also block all event listeners on subsequent nodes in the propagation path, as usual. But, for `composed: bounce` events, this means that you would always be certain that event listeners in the DOM context nearest the `target` would run *before* the event listeners of the *upper* DOM contexts. This means that on a per-DOM context level, the event propagation follows the bubble logic, while within each DOM context, propagation proceeds in the usual propagation sequence: capture, target, and then bubble. 

> `stopPropagation()` will also stop any subsequent `bounce`.

## `composed: false` vs. `composed: bounce`

`composed: bounce` is very much similar to `composed: true`. For example:

1. When the `bounce-change` event propagates in an upper DOM context, it will be re-`target`ed to the host node that exists in that context. This is exactly the same re-`target`ing that happens when a `composed: true` event propagates in a DOM context above. This also causes the `eventPhase` to register as `2`(target phase) when the event listeners are intercepted on the host node, when in reality this event listener runs in the capture or bubble phase. 
 
But, there are a few subtle differences that make sense.

1. `stopPropagation()` on elements in upper DOM contexts can no longer "torpedo" and silence an event *before* an event listener inside the web component has had a chance to listen for it. This is a double-edged sword: 
   * On one side, it means that within the web component, you can be certain that you will be notified of any events when you listen for it, but 
   * On the other side, this robs the outer context of its ability to use `stopPropagation()` calls in `capture` phase event listeners above an inner web component to stop the web component from doing something.

2. Often, an inside change might not be an outside change. Let's take an example:
   1. You have *two* `<input>` elements inside the shadowDOM of a web component.
   2. You switch focus from one of these `<input>` elements to the other.
   3. In the context of the shadowDOM, this is a focus shift, and it should trigger a.o. a `focusin` and a `focusout` event.
   4. But, in the context of the host node, this is not a focus shift. Within this context, the focus is still within the host node.
   5. Custom implementations of `composed: bounce` events could prevent the event from being bounced when the state remains the same from the point of view of the host node's lightDOM.

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

## Why bounce?

The native focus events bounce. Or kinda bounce. So to understand the focus events, it is useful to understand the hypothetical concept of event bouncing.

But. The two propagation orders of `composed: true` and `composed: bubble` overlap. They fulfill many of the same use-cases. So. Which is better? And, can we replace one with the other?

1. If we look at the propagation order of target and bubble phase event listeners, then their propagation order remain the same both in sequence `composed: true` and `composed: bubble`. As the majority of event listeners are added in the bubble phase, there would be little difference for a majority of use cases. This means that for target and bubble event listeners only `.stopPropagation()` would work the same way for `composed: true` and `composed: bubble`. Ergo: Ergo: if we disregard capture phase event listeners, then `composed: true` could be replaced by `composed: bubble`.

2.  The `composed: true` vs `composed: false` dichotomy doesn't support having an event both a) cross shadowDOM borders *and* b) be dispatched from a root node that is *not* the top `window` node. This means that there are several use cases, such as those present for focus events, that require some kind of hack solution in order to have the same event propagate across shadowDOM borders but also be stopped at a shadowRoot higher up in the DOM.  

3. If we look at the propagation order of capture phase event listeners, then there is a clear difference. `composed: true` enable a higher DOM context event listeners to capture an event *before* an event listener in a lower DOM context. This cannot be replicated in `composed: bubble`, and so for example EarlyBird event listeners would be impossible. Thus, `composed: bubble` would require:
   1. the existence of `addDefaultAction()` or some other kind of post-propagation callback to control which default action is set up, and 
   2. some type of pre-propagation callback (particularly for UIEvents) that would enable web developers to:
      * grab certain event types, as the native drag'n'drop events do mouse events, and/or 
      * block/stop the propagation of certain events to lower DOM contexts when needed.   

4. The property `capture: bubble` is only hypothetical. But, if all `composed: true` events were made to bounce instead, then all events could be set as `composed: false`. Thus, if all functions that today dispatch `composed: true` events were to instead dispatch bouncing events, then all events could be set to `composed: false` and presto: there would be no need for the `composed` property on events at all and it could simply be removed.
  
5.  Which conceptual model is more or less orderly/understandable?
   * If you look at all the nodes in a flattened DOM, then the `composed: true` with its straight line down and straight line up looks nice. But, if you look at the flattened DOM as a group of nested DOM contexts, then `composed: bubble` is simpler as it would present the overall propagation as a single line between DOM contexts, from inner to outer. When web components are slotted or nested inside each other, the `composed: bubble` has clear conceptual advantages over `composed: true` as developers can at best be expected to envisage the flattened DOM context and not all the flattened DOM nodes. 
   * When you develop a reusable web component, you do *not* know what the surrounding DOM looks like. From the perspective of a reusable web component, the propagation path thus has other, external event listeners running **before and after** if `composed: true`, while in `composed: bubble` the propagation path of " access to the above DOM propagation path. Hence, from the perspective of the web component, then the `capture: bubble` is simpler.
   * When you make a web component or main document using web components, you are *not* expected to understand the inside of the web component. It could therefore be very confusing if an event propagated into a web component, but not out of it. So, also from the developer of an upper level DOM context, it is simpler to know that the inner propagation has completed before any of your own event listeners run (both capture phase and bubble phase).
   
6. Should events propagate into the shadowDOM when an event is dispatched on the  
       

   
## Discussion



Would it have been better to bounce all `composed: true` events? Would it be better, more understandable sequencing, if `click` for example was bounced? 

That would make it much simpler to make defaultActions at least.. 

It cannot be polyfilled, because the `isTrusted` property cannot be cloned in the bounce clone event. 

It will be very inefficient for `mousemove` events etc.
 
But `composed: true` likely should have been designed in this way from the outset..
    
## References

 * 