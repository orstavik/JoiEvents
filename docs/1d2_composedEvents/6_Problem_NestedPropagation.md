# Problem: nested propagation

```html
<h1>Hello sync world!</h1>
<h2>Hello async sunshine!</h2>
<script>

  function log(e){
    console.log(e.type, e.currentTarget, e.target.innerText);
  }

  const h1 = document.querySelector("h1");
  const h2 = document.querySelector("h2");

  h1.addEventListener("mouseup", log);
  h2.addEventListener("mouseup", log);
  document.addEventListener("mouseup", log);
  window.addEventListener("mouseup", log);

  h1.addEventListener("click", log);
  h2.addEventListener("click", log);
  document.addEventListener("click", log);
  window.addEventListener("click", log);

  h1.addEventListener("change-state", log);
  h2.addEventListener("change-state", log);
  document.addEventListener("change-state", log);
  window.addEventListener("change-state", log);

  //SYNC event dispatch
  h1.addEventListener("click", function(e){
    e.target.dispatchEvent(new CustomEvent("change-state", {composed: false, bubbles: true}));
  });
  //ASYNC event dispatch
  h2.addEventListener("click", function(e){
    setTimeout(function(){
      e.target.dispatchEvent(new CustomEvent("change-state", {composed: false, bubbles: true}));
    }, 0);
  });

  //changing change in the lightDOM from lightDOM event listeners, this is normal
  document.addEventListener("click", e => e.target.innerText += "$");
  document.addEventListener("change-state", e => e.target.innerText += "?");
</script>
```

## Dispatching event *async*

We begin by `click`ing on `<h2>Hello async sunshine!</h2>`.  This produces the following result:

```
mouseup h1              Hello async sunshine!
mouseup #document       Hello async sunshine!
mouseup window          Hello async sunshine!
click h1                Hello async sunshine!
click #document         Hello async sunshine!
click window            Hello async sunshine!$
change-state h1​         Hello async sunshine!$
change-state #document  Hello async sunshine!$
change-state window     Hello async sunshine!$?
```
We start by looking at the propagation. Which is very nice! First comes 3x`mouseup`, then 3x`click`, and then 3x`change-state`. No surprises, no confusion there.

A little more confusing is the state changes of the `target` text. However, with a clear propagation sequence to contend with, this state change is manageable:
1. `click` event propagation: "$" is added to the text at the last of two event listeners on `document`. This means that during `click` event propagation, the "$" is only visible when the last `click` event listener on the `window` prints the `target` state. 
2. `change-state` even propagation: `click` event propagation is finished, so "$" is added to the end of the text already. And as during `click` event propagation, the "?" is only added to the text at the last of two event listeners on `document`. This means that it is only the last event listener who prints the text with "?".  

## Dispatching event *sync*

The problems begin when you `click` on `<h1>Hello sync world!</h1>`. Here, we get the following result:

```
mouseup h1​ Hello sync world!
mouseup #document Hello sync world!
mouseup window Hello sync world!
click h1​ Hello sync world!
  change-state h1​ Hello sync world!
  change-state #document Hello sync world!
  change-state window Hello sync world!?
click #document Hello sync world!?
click window Hello sync world!?$
```

Dispatching the event sync leads to a) nested propagation of the events which in turn leads to b) confusing state changes.

#### Nested propagation sequence:

The `change-state` event listeners run *in between* the event listeners for the `click` event. After the first `click` event listeners is triggered, then the three `change-state` event listeners run, before the control is returned to the `click` event listeners who completes the last two `click` listeners. The `change-state` event propagation is *nested* inside the `click` event propagation. 

Nested event propagation is bad. It confuses developer who likely only think about the sequence of the event he currently is listening for. Therefor, the browser should avoid nesting event propagation so to avoid requiring the developer to think about the sequence of more than one set event listeners at the same time. *And*, that is what the platform does! As the demo illustrate, all `mouseup` event listeners conclude *before* the `click` event begins its propagation; it is the custom `change-state` event that we dispatch manually, and queue sync, that nests.
 
> In fact, the platform almost exclusively queue its events *async*. (It is only events triggered by methods such as `.reset()` that dispatch events immediately (ie. a native `reset` event *not queued async*) which will propagate nested inside the event propagation of the event whose event listener called the `.reset()` method). 
  
In the demo above, we should anticipate that a developer would think only about the sequence of the `click` event listeners when he makes these listeners, and only about the sequence of the `change-state` event listeners, when he makes those. In the demo above, we should expect the developer to be confused in the following way:
1. When he makes the `click` event listeners, he is likely to assume that the two latter `click` event listeners are run *before* the `change-state` event listeners run.
2. When he makes the `change-state` event listeners, he is likely to assume that `change-state` only begins *after* all the `click` listeners has completed.
   
The developer is likely to expect that the `change-state` event occurs after `click` has finished its propagation in the same way as `click` only occurs after `mouseup` has finished its propagation.

#### Nested propagation state changes:    

Because of the confusion of sequencing, any state changes done in event listeners for the nested or nesting event is likely to be even more confusing.
 
In the demo above, when the `change-state` event is dispatched sync, the developer would likely expect the "$" to be appended to the string before the `change-state` event listeners run. Similarly, the developer would be surprised to find a "?" symbol already appended during the latter two `click` event listeners.

Thus, nesting event propagation by dispatching an event sync from within another event listener is likely to confuse developers.

## HowTo: avoid nesting event propagation

There are three ways to avoid nesting event propagation:
1. dispatch the second event *at the very beginning* of the first event's propagation. This essentially means to dispatch the second event (cf. `state-change`) from an EarlyBird event listener on the first event (cf. `click`): `window.addEventListener("click", e=>e.target.dispatchEvent(new CustomEvent("state-change", ...)), true)`.
  
  However, this would revert the event sequence, having the second event complete its propagation before the first event begins its propagation.
  
2. dispatch the second event *at the very end* of the first event's propagation. This however is very precarious:
   * there can be no event listener calling `.stopPropagation()` before it.
   * this precludes this strategy from being employed on `composed:true` events. 
      
3. Delay the event propagation in the event loop using an async callback such as `setTimeout()` and `toggelTick()`.

## References