# Pattern: AfterthoughtEvent

The AfterThoughtEvent is a custom, composed event that is dispatched *after* the triggering event.
The event triggering function is added as an EarlyBird event listener, and 
so the propagation of the AfterthoughtEvent is postponed until *after* the propagation of the 
triggering event has completed. 

To postpone the dispatch of the AfterthoughtEvent, we use `setTimeout(..., 0)`. 
Before a new task is retrieved from the `setTimeout(..., 0)` que, the propagation of the triggering
event must be completed. (This is also why we can't use `Promise.resolve().then(...)` as micro tasks 
will be dispatched *before* propagation to the next event listener function.)
Since we are using the EarlyBird pattern, the custom composed event propagation will likely
(but not surely) be next.

```javascript
function dispatchAfterthoughtEvent(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  return setTimeout(function(){target.dispatchEvent(composedEvent);}, 0);
}

function onClick(e){
  if (e.defaultPrevented || e.customPrevented)
    return;
  const echo = new CustomEvent("echo-click", {bubbles: true, composed: true});
  dispatchAfterthoughtEvent(e.target, echo, e);
}

document.addEventListener("click", onClick, true);
```

## Example: `echo-click` AfterthoughtEvent 

Below is an implementation of the `echo-click` using the AfterthoughtEvent pattern.

<code-demo src="demo/AfterthoughtSunshine.html"></code-demo>
```html
<script>
function dispatchAfterthoughtEvent(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  return setTimeout(function(){target.dispatchEvent(composedEvent);}, 0);
}

function onClick(e){
  if (e.defaultPrevented || e.customPrevented)
    return;
  const echo = new CustomEvent("echo-click", {bubbles: true, composed: true});
  dispatchAfterthoughtEvent(e.target, echo, e);
}

document.addEventListener("click", onClick, true);
</script>

<h1>Hello sunshine!</h1>

<script>

  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type);
  }
  const sunshine = document.querySelector("h1");
  const root = document.querySelector("h1").children[0];
  //click listeners
  window.addEventListener("click", log);
  root.addEventListener("click", log);
  sunshine.addEventListener("click", log);
  root.addEventListener("click", log, true);
  window.addEventListener("click", log, true);
  
  //echo-click listeners
  window.addEventListener("echo-click", log);
  root.addEventListener("echo-click", log);
  sunshine.addEventListener("echo-click", log);
  root.addEventListener("echo-click", log, true);
  window.addEventListener("echo-click", log, true);
</script>
```

This looks nice! The `click` event completes its propagation *before* the `echo-click` begins
its propagation. But.. There is a problem..

## Problem: defaultAction queued *before* the AfterthoughtEvent propagates

The AfterthoughtEvent pattern and its `setTimeout(..., 0)` has *one* big drawback:
It not only completes the propagation of the triggering event *before* the composed event;
it also *adds the defaultAction task to the task que **before** the composed event begins 
its propagation*. This means that the defaultAction has *not* yet run, before the custom composed 
event propagates, but that the defaultAction becomes *unstoppable* while the custom composed event
propagates.
                      
Below is a demo that illustrates the problem in more detail.

<code-demo src="demo/AfterthoughtProblems.html"></code-demo>
```html
<script>
function dispatchAfterthoughtEvent(target, composedEvent, trigger) {               
  composedEvent.trigger = trigger;
  return setTimeout(function(){target.dispatchEvent(composedEvent);}, 0);
}

function onClick(e){
  if (e.defaultPrevented || e.customPrevented)
    return;
  const echo = new CustomEvent("echo-click", {bubbles: true, composed: true});
  dispatchAfterthoughtEvent(e.target, echo, e);
}

document.addEventListener("click", onClick, true);
</script>

<p>
This demo below illustrate how the AfterthoughtEvent works and its problem relating to defaultActions. 
It uses only two event listeners on two elements to show how the defaultActions cannot be
controlled from custom, composed AfterthoughtEvents.
</p>
<ul>
  <li>click me, i will echo click</li>
  <li><a id="prevented" href="https://bbc.com">click me, i will prevent both the echo and the navigation</a></li>
  <li><a href="https://bbc.com">normal link, will navigate</a></li>
</ul>

<script>
window.addEventListener("click", function(e){alert("click event");});
window.addEventListener("echo-click", function(e){alert("echo-click event");});
//ATT!! Even though preventDefault() is called on the trigger click event, 
//      before the browser does any navigation, it has no effect!!
window.addEventListener("echo-click", function(e){e.trigger.preventDefault();}, true);  
document.querySelector("#prevented").addEventListener("click", function(e){
  e.preventDefault();
});
</script>
```

When the AfterthoughtEvent propagates, it is too late to call `preventDefault` on the triggering 
`click` event. The defaultAction is queued and irreversible sometime once the `click` event
finishes propagation, but before the browser (Chrome) retrieves its next task from the `setTimeout(...)`
que. The browser might sometimes que and run the `alert("echo-click event");` task, but 
it will regardless and inevitably load the a page. 
There is simply no way to que a composed event to propagate *after* the propagation of the trigger
event, but still *before* the scheduling the defaultAction.

So, while the event sequence order between the trigger event and the composed event is intuitive,
the control of the defaultAction is lost. This means that the AfterthoughtEvent:
 * is *not* suited when the trigger event has a defaultAction, and 
 * should only be used when *none* of the triggering events has defaultActions that needs to be controleld.

todo: Find a list of native events that has no defaultAction. AfterthoughtEvent can be used for tese events.  

## AfterthoughtEvent vs PriorEvent

The benefit of the AfterthoughtEvent is that it follows the intuitive, conventional event sequence:
trigger event first, composed event second. 
But, the AfterthoughtEvent cannot control the triggering events defaultAction.

If your custom composed event needs to control the defaultAction, 
then you need to use the PriorEvent pattern. This turns the event sequentiality on its head, 
propagating the triggered, composed event before its triggering event. Which is confusing.
But the PriorEvent gives full control of both the propagation and defaultAction of the trigger event,
which in many instances is needed.

## References

 * [stackoverflow: `setTimeout(..., 0)`](https://stackoverflow.com/questions/33955650/what-is-settimeout-doing-when-set-to-0-milliseconds/33955673)