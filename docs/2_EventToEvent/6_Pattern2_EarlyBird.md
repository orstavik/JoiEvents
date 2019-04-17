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

<code-demo src="demo/EarlyBirdClickEcho.html"></code-demo>

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

 * 