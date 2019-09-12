# Pattern: CallShotgun

The EarlyBird pattern *does not work* for events that:
 * do **not** bubble, such as `resize`, and
 * is dispatched to the `document` node, such as `scroll`.
 
These trigger events enter the "target phase" either directly or is in the `capture` phase for only *one* element, which is not sufficient for the EarlyBird pattern.

To control the priority of event listeners for such non-bubbling events, we use the the CallShotgun pattern.

The CallShotgun pattern:
1. adds two empty event listeners (just a function name essentially) 
2. to the `window` object 
3. in the `capture` phase
4. as soon as the document loads.

By running the CallShotgun script first in the main document, the event listeners will be processed first. This gives the developer some control of the priority of the processing of his event listeners. Later, when the developer needs, the empty names can be assigned to *real* functions.

For functions that only needs to block another event some of the time, the event listener function name must be `undefined` when there is no need to block the event. But, adding an empty event listener function can also be beneficial to *delay* loading a full script for a complex composed event function until the end of the document, as doing so can speed up first meaningful paint.

## Demo

<code-demo src="demo/CallShotgun.html"></code-demo>

In the above example the EarlyBird listener function is added *before*
the function is loaded. It "calls shotgun". Later, when it is good and ready, 
the app loads and defines the actual function and takes a seat.
Now, if the shotgun happens to be triggered before the event listener function is loaded, 
it would still only result in a silent error / nothing happening.
And as soon as the function is defined, the trigger function would work as intended.

## References

 * 