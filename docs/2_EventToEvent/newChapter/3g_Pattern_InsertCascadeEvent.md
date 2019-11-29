# Pattern: InsertCascadeEvent

In this pattern we make a Cascading event that we *insert* in between a trigger event an its defaultAction.

The principle is that we:
1. stop the default action.
2. add a task to the event loop using SetTimeoutZero that
3. dispatch a new CascadingEvent that propagates and
4. resurrect the original defaultAction.

When we set up the preventDefault, we need to have the defaultPrevented and a state variable that allows the value to be set to true, but never reversed back again. 

<code-demo src="demo/InsertCascadeEvent.html"></code-demo>

## References

 * 