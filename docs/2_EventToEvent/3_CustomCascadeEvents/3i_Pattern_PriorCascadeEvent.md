# Pattern: PriorCascadeEvent

This is an alternative to the ReplaceCascadeEvent. It basically runs the cascading event before the triggering event, and it links its preventDefault to *both* call stopImmediatePropagation() on the trigger event *and* call the trigger event's preventDefault.

Remember to make the defaultPrevented property here too.

<code-demo src="demo/... contextmenu is suitable here too...   .html"></code-demo>

## References

 * 