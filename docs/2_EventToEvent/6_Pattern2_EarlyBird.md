# Pattern: EarlyBird

To compose an event, we need one or more original, *trigger events* to make it from.
And to get hold of these trigger events, we *must* listen for them.

But, what if:
1. some other function in your app
2. listens for the same event, 
3. receives and processes the event *before* your trigger function, and
4. calls `.stopPropagation()` or `.stopImmediatePropagation()` on it?

As we saw in the last example in [HowTo: StopPropagation](4_HowTo_StopPropagation), this
will mute your trigger function. So, to avoid being blocked like this, we want
to add our event listener as early as possible. We want an EarlyBird event listener.

## HowTo: block an EarlyBird

The earliest possible moment we can listen for an event is in the *capture* phase on the `window`.
But. This is *too* early. If we *capture* the event on the `window`, we cannot deliberately cancel 
the trigger function afterwards if the trigger event is dispatched. Even when we desperately need to. 
Therefore, we *capture* trigger events on the `document` instead.

```javascript
document.addEventListener("some-event", function(e){
  someFunction(e);
}, true);
```

As we saw in the previous chapter [Pattern: CancelClick](5_Pattern20_CancelClick), 
the `click` event cannot be prevented when it is composed from `mousedown` and `mouseup` events.
To prevent the native composed `click` event from the `mouseup` event, we therefore called
`cancelEventOnce("click")`.

A similar problem applies to all our custom composed events that we create with the EarlyBird pattern. 
In order to *prevent* a custom composed event, we need to be able to call `preventDefault()` on the
triggering event *before* it is captured by the EarlyBird trigger function. And since we have
added the EarlyBird on the `document`, we can now do this on the `window`.

Furthermore. Custom composed events can be composed from all types of native events. This means that
some of the triggering events might not be `cancellable`. In such cases, we set a custom property 
called `customPrevented`.

## Implementation: EarlyBird

The EarlyBird pattern consists of two parts:

1. The primary trigger function is added on the `document` node in the capture phase for a 
   trigger event. The first thing this function checks is to see if either `defaultPrevented` 
   or `customPrevented` is `true` on the trigger event.

2. To block an EarlyBird trigger function, you add call `preventDefault()` on the triggering event
   (or set `customPrevented` to `true` instead if the triggering event is not cancellable).
   This triggering event must *captured* on the `window` node so that it is registered before
   the EarlyBird primary trigger is captured on the `document`.
   
## Example: `click-echo` EarlyBird

```html
<div>
  <h1 id="world">Hello world</h1>
  <h1 id="sunshine">Hello sunshine!</h1>
</div>

<script>

  const div = document.querySelector("div");
  const sunshine = document.querySelector("#sunshine");
  const world = document.querySelector("#world");

  function echo(e){
    if (e.defaultPrevented || e.customPrevented)
      return;
    const echo = new CustomEvent("echo-" + e.type, {bubbles: true, composed: true});
    e.target.dispatchEvent(echo);
  }

  function cancelEventOnce(type) {
    const oneTimer = function (e) {
      e.cancelable ? e.preventDefault() : e.customPrevented = true;
      window.removeEventListener(type, oneTimer, true);
    };
    window.addEventListener(type, oneTimer, true);
  }

  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type);
  }

  //echoes all click events
  document.addEventListener("click", echo, true);

  //cancel the click event for #world to prevent the echo from occurring
  world.addEventListener("mouseup", function(){ cancelEventOnce("click"); });

  //click listeners
  window.addEventListener("click", log);
  div.addEventListener("click", log);
  sunshine.addEventListener("click", log);
  world.addEventListener("click", log);
  div.addEventListener("click", log, true);
  window.addEventListener("click", log, true);

  //echo-click listeners
  window.addEventListener("echo-click", log);
  div.addEventListener("echo-click", log);
  sunshine.addEventListener("echo-click", log);
  world.addEventListener("echo-click", log);
  div.addEventListener("echo-click", log, true);
  window.addEventListener("echo-click", log, true);
</script>
```   

## Pattern: CallShotgun

In almost all cases, the EarlyBird pattern is enough in itself. 
But, *if* for some mysterious reason:
 * another EarlyBird event listener that 
 * also calls `stopImmediatePropagation()` 
 * is added *before* your event trigger function and
 * you do not want to move your event listener scripts up top as it will delay first meaningful paint,
 
then you can employ another pattern: CallShotgun.

```html
<script>
window.addEventListener("click", function(e){clickEcho(e);}, true);    //1. calling shotgun
</script>
<script >/*Here is the bad, but unavoidable library with an EarlyBirdStopPropagationTorpedo*/
window.addEventListener("click", function(e){e.stopImmediatePropagation();}, true);
</script>

<h1>hello world</h1>

<script >/*Here is your composed event that you would like to load as late as possible.*/
function clickEcho(e){                                                //2. taking a seat
  e.target.dispatchEvent(new CustomEvent("click-echo", {composed: true, bubbles: true}));
}
window.addEventListener("click-echo", function(e){alert("click-echo");}, true);
</script>
```

In the above example the EarlyBird listener function is added *before*
the function is loaded. It "calls shotgun". Later, when it is good and ready, 
the app loads and defines the actual function and takes a seat.
Now, if the shotgun happens to be triggered before the event listener function is loaded, 
it would still only result in a silent error / nothing happening.
And as soon as the function is defined, the trigger function would work as intended.

> Create custom, composed event with the EarlyBird pattern.
> If you really need, you can CallShotgun too.

## References

 * tores

## Old drafts

```javascript
window.addEventListener("trigger-event", function(e){eventTriggerFunction(e)}, true);
//window.addEventListener("trigger-event", e => eventTriggerFunction(e), true); //works, but not everywhere
//window.addEventListener("trigger-event", eventTriggerFunction, true); cannot be used with the CallShotgun pattern.
```

The above example adds an event listener to the window object for a certain trigger event.
The first trick here is the third argument, `true`.
This `true` specifies that the event listener will be executed during the little-known "capture phase"
(when events propagate *down* the DOM), as opposed to the "normal, bubble phase" 
(when events propagate *up* the DOM).
This means that the `eventTriggerFunction` will be executed during the first stage of 
the trigger event's propagation.

## Demo: `click-echo`

Below is a demo that echoes the demo in StopPropagationTorpedo. 
In this demo however, the `click-echo` event is added at the very beginning of the propagation chain.
This makes it precede and escape the StopPropagationTorpedos.

```html
<h1>hello <a href="#oOo__ps">world</a></h1>
<p>
To test this out, you can comment out all the three torpedo listeners. 
Only then will you get the composed h1-click event.
</p>

<script>
document.querySelector("h1").addEventListener("click", function(e){
  e.stopImmediatePropagation();
  alert("StopPropagationTorpedo 1");
});
</script>

<script>
function clickEcho(e){
  e.target.dispatchEvent(new CustomEvent("click-echo", {composed: true, bubbles: true}));
}
document.querySelector("h1").addEventListener("click", clickEcho);

window.addEventListener("h1-click", function(e){alert("h1-click");}, true);
</script>

<script>
document.querySelector("a").addEventListener("click", function(e){
  e.stopPropagation();
  alert("StopPropagationTorpedo 2");
});
</script>

<script>
window.addEventListener("click", function(e){
  e.stopPropagation();
  alert("StopPropagationTorpedo 3");
}, true);
</script>
```
