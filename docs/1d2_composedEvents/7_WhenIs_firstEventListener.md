# Pattern: EarlyBird

> gets the worm!

An EarlyBird is a generic event listener set to trigger in all instances of a given event type. EarlyBirds are implemented as:
1. a set of codependent event listeners
2. added to the `window` node and as many of the `shadowRoot`s in the propagation path as needed/possible
3. in the capture phase.

## Global EarlyBirds

### Simple

Global events always propagate from the `window` in the `CAPTURING_PHASE` first. If all you need is to catch a global event on the first node, then all you need is:

```javascript 
window.addEventListener("globalevent", callback, true);
```

### Very first EarlyBird

If you need to ensure that the event listener not only runs on the first propagation node, but also as the first event listener on that node, you need to:
1. ensure that the event listener option `first` or `priority` is enabled on the `window` node, and then
2. add a simple EarlyBird on the `window`.

### EarlyBird subscription

But. Event listeners added on the `window` do not have access to see the full `composedPath()` of `composed: true` events *inside `closed` `shadowRoot`s*. If your EarlyBird event listener needs access to the full propagation path (ie. needs to know which `target` is hit inside web components shadowDOM), then a set of coordinated event listeners needs to be added not only to the `window`, but also to all the `shadowRoot`s that need it.

So, while a simple EarlyBird can ensure that a function *run once, at the first node, but with limited scope*, an EarlyBird can *run multiple times, at the first node of each DOM context which subscribes to it, but with as full a scope of the event as needed. 

```javascript
//todo not tested
const processedScope = new WeakMap();
function earlyBird(event){
  const currentPath = event.composedPath();
  const alreadyProcessedPath = processedScope.get(event) || [];
  const unProcessedNodes = currentPath.slice(0, currentPath.length - alreadyProcessedPath.length);
  processedScope.set(event, currentPath);
  //The list of unprocessed nodes are that this invocation of the EarlyBird subscription should work with. The list of alreadyProcessedPath is the nodes that a previous version of this EarlyBird knew about. 
}

function subscribeToEarlyBird(globalType, propagationRoot) {
  propagationRoot.addEventListener(globalType, earlyBird, true);
}

subscribeToEarlyBird("globalevent", window);  //for example click event

//then, to extend the scope of the EarlyBird into the shadow of WebComponents that need it,
//the WebComponent's constructor should register its shadowRoot with the EarlyBird subscription.
class WebComp extends HTMLElement{
  constructor() {
    super();
    const shadow = this.attachShadow({mode: "closed"});
    shadow.innerHTML = `...`;
    subscribeToEarlyBird("globalevent", shadow);  //for example click event
  }
}                                                  
```


> Much of the hassle with `composed: true` EarlyBirds could have been avoided if the propagation path had been flattened in DOM context order first, then eventPhase order, instead of vice versa. If `composed: true` events had bounced inside-out, the very first event listener node would have been the innermost shadowRoot. Each bounced event would then only know of its own context, which would have been much clearer and simpler to work with. 

This pattern is best set up as a subscription for a particular event processing function that by default is added to the `window` and then also included in every web component who require it to run against its shadowDOM.




```javascript
if(isGlobalEvent(eventType))
  window.addEventListener(eventType, callback, {capture: true});
```

However, to do so universally for local events is not so simple. The problem with local events is that their propagation root *can* be either the `window` or any `shadowRoot` in the DOM. The best thing we can do with local events is to:
1. add event listeners on *both* the `window` *and* all the `shadowRoot`s we can, and then
2. check the status of the propagation afterwards. 

```javascript
function listenEverywhere(event){
  //check if the .currentTarget is the propagation root
  const path = event.composedPath(); 
  if(path[path.length-1] === event.currentTarget && event.eventPhase !== Event.BUBBLING_PHASE){
    //here we can do stuff we only wish to do on the first event listener trigger  
  }
}
```

If we only wish to ensure that we call the same event listener function once, and do not care too much if the propagation sequence is still on the first node, we can also add a custom property to the event instance to cancel any redundant event listener functions.

```javascript
function listenOnce(event){
  if(event.hasBeenProcessedByFunctionXYZ)
    return;
  event.hasBeenProcessedByFunctionXYZ = true;
  //the code added here will only run once per event instance, 
  //even though the listenOnce function has been added to 
  //several nodes in the same propagation path. 
}
```




```javascript
window.addEventListener(globalType, callback, true);
```

But, there is a problem. This EarlyBird doesn't get the full `.composedPath()` for `closed` `shadowRoot`s. If the function that needs to run on the first node of propagation also need to access the context of the event within the innermost shadowDOM, then it needs to be added as an event listener on a node within that shadowRoot.

For local events, this means a single listenOnce function added to the `window` node and all the `shadowRoot`s that might need it. The best approach to set up and use such listeners would be as a subscription.  


## Pattern: EarlyBird event listener for `composed: true`

To add an event listener to the propagation root require that we *know* the propagation root in advance for a particular type of event. For `composed: true` events, the propagation root is known: `window`. And so, the first event listeners called would be the event listeners added to the `window` node in the `CAPTURING_PHASE`. Here is what that would look like for `click` events:
  
`window.addEventListener("click", e => console.log("i run first"), {capture: true});`.

We call event listeners added to the `window` with `{capture: true}` for EarlyBirds. And they can be quite handy. They often gets the worm. 

## EarlyBird issue 1: sequencing

However, there are some sequencing issues with EarlyBirds: 

1. Events that `target` the `window` only propagate on the `window` node in the `Event.AT_TARGET` phase. This means that all event listeners, EarlyBirds included, will simply be called in the order in which they were added. EarlyBirds have no special place in the propagation path and thus no special role for events that `target` the `window`.

2. Different parts of the app may add multiple EarlyBirds for the same event type. When multiple EarlyBirds are added, they will run in the order they were added. The EarlyBird pattern provides no means to control the sequence between multiple EarlyBirds when that is needed.

3. CaptureTorpedoes still apply to EarlyBird. One EarlyBird may or may not block other EarlyBirds from running by calling `stopImmediatePropagation()`. Thus, while less exposed to being torpedoed by a `stopPropagation()` call than other event listeners, EarlyBirds are by no means absolutely safe. 

To solve these problems, the developer would need to control the sequence of execution of EarlyBird event listeners, and event listeners on the `window` node. In addition, either rules or conventions would need to be established about which type of event listeners should be able to call `stopImmediatePropagation()` when.

## Pattern: CagedEarlyBird

When a `composed: true` event `target` an element inside a `closed` shadowRoot, then no EarlyBird can see the "original" `target` nor the full propagation path of the event. The purpose of `closed` shadowRoots is precisely to *hinder* such introspection into its inner elements: hence, all event listeners added to nodes in the propagation path *outside* of that shadowRoot will *never* be able to read the part of the propagation path that exist inside the `closed` shadowRoot. As EarlyBirds are added to the `window` node they cannot see the full propagation path of `composed: true` events that `target` a node inside a `closed` shadowRoot.

Not being able to see the full propagation path is a show-stopper. It limits the EarlyBird pattern from being used by `closed` web components. Instead, we must employ a different strategy called the CagedEarlyBird.

The CagedEarlyBird adds *two* event listeners:
1. a regular EarlyBird (ie. a `CAPTURING_PHASE` event listener on the `window`) that temporarily block the `stopPropagation()` and `stopImmediatePropagation()` methods for all event listeners in the capture phase on the event instance.
2. a CagedBird (ie. a `CAPTURING_PHASE` event listener on the `shadowRoot` of the `closed` web component) that is ensured to complete its task.  

It would look something like this:

```javascript
function noCapturePhaseStopPropagation(e){
  e.stopPropagation = function(){
    if (this.phase !== Event.CAPTURING_PHASE)
      return this.prototype.stopPropagation();
    console.warn("stopPropagation() has been temporarily blocked!!");
  }.bind(e);
  e.stopImmediatePropagation = function(){
    if (this.phase !== Event.CAPTURING_PHASE)
      return this.prototype.stopPropagation();
    console.warn("stopImmediatePropagation() has been temporarily blocked!!");
  };
}
window.addEventListener("click", noCapturePhaseStopPropagation, true);


```



Instead of using EarlyBirds, `closed` web components can add an `unstoppable` event listener on their shadowRoot in the `CAPTURING_PHASE`. Such `unstoppable` event listeners would be able to queue

## WhatIs: the first event listener for `composed: false` events?

The first event listeners for a `composed: false` event must be added to the propagation root for *all* the DOM contexts in which it should apply. For `closed` web components, this means that *both* is added to either:
1. the shadowRoot for  or the `window`. These event listeners must be added within each shadowRoot

## Conventions for stopPropagation()

1. `stopPropagation()` should not be called in the `CAPTURING_PHASE` of an event. The one exception from this rule is to grab an event. To grab an event is to call `stopImmediatePropagation()` and  `preventDefault()` is both called by the *very* event listener. Grabbing an event is used to either cancel and remove it as if it never happened, or to highjack, grab, and rename it (cf. mouse becomes drag events). 

2. web components that listen for certain events to add a default action should do so in the capture phase on their shadowRoot. They should then add:
   1) (if `isStopped` and `unstoppable` is available) an `unstoppable` event listener on the last target (the `getPropagationRoot` for `bubbling` events and the `target` for non-bubbling events) , or 
   2) a `toggleTick` fallback if `unstoppable` is not available.
   
There are two strategies to try to avoid other event listeners doing CaptureTorpedoing an event listener added on shadowRoots for `composed: true` events:
 1. implement an `unstoppable` event listener on a per-event basis. This is done by adding an EarlyBird (in the code next to the event listener in the ShadowDOM) essentiall override the `stopPropagation()` and `stopImmediatePropagation()` for all events t try to avoid having other event listeners add that   

A postPropagation callback for composed: true events would require a twostep event listener:
 1. first an unstoppable event listener would be called upon inside the shadowDOM. This event listener would then add another event listener on the window bubble phase that would also be unstoppable. The added event listener should have a lexical scope to read the properties from the closed shadowDOM. 


If this is universally available, this solves the problem of This has the benefit of being able to implement a last option for defaultAction. Instead of using EarlyBird, we implement a PostPropagationCallback..

No, i should call them prePropagation
postPropagation
prePrePropagation
And do so in the next chapter.

This means that we can implement the addEventListener options as defaultAction and EventController.. This simplifies the interface a lot.. Then you just add defaultActions and EventControllers as regular event listeners anywhere, except that they are marked with "eventcontroller: true" or "defaultaction: true"..

slight reduction in StopPropagation speed vs. increased speed of the defaultAction task. Using event listeners is much less heavy than using toggleTick. And... how speed sensitive is addEventListener and stopPropagation() really??

## References

 * (discussion about closed shadowDOM intention)[https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975]