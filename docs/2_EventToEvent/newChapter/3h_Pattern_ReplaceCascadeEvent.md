# Pattern: ReplaceEvent

In this pattern we replace one Event with another. To accomplish this, we:
 1. stop the propagation of the current event from the `window` capture phase, 
 2. create a new event and link its preventDefault and defaultPrevented properties to the trigger events properties,
 3. immediately dispatch and propagate the new event, and then
 4. let the trigger events defaultAction run as planned if `preventDefault()` has not been called for the cascade event.

<code-demo src="demo/... make demo for contextmenu here...   .html"></code-demo>

## References

 * 