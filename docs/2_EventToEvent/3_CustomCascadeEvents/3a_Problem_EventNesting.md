## Problem: Event nesting

As native events *always complete* their own propagation *before* they trigger a cascade event, this means that **native events never nest**. 



### Example 3: Custom events (echo-click)
 
 <code-demo src="demo/EchoClick.html"></code-demo>
 
 When events are dispatched from JS via methods such as `.dispatchEvent(..)` or `.click()`,
 then they do *not* propagate one-by-one, but propagate *nested one-inside-another*.
 You see this in the example above that as soon as `.dispatchEvent(...)` for `echo-click` 
 and `echo-echo-click` are called, they start to propagate down in the capture phase *before*
 their trigger `click` and `echo-click` events have completed.

