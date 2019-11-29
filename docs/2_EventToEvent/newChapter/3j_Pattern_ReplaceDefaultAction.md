# Pattern: ReplaceDefaultAction

This is the last alternative. It:
 1. preventDefault() on the trigger event. 
 2. Set up a new setTimeoutZero task for the replacement event/ or task. The full preventDefaultSystem.
 3. dispatches a new cascade event event, if the preventDefault() was not called.

<code-demo src="demo/... link click is suitable here...   .html"></code-demo>

## References

 * 