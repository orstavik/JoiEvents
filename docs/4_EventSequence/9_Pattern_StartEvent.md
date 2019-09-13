# Pattern: StartEvent

When a gesture begins, or might begin, there are more tasks that need to be done than only updating pseudo-classes and dispatching an event on a target. The start event is also the place where the settings of an EventSequence is controlled.

Settings for EventSequences should *mainly* be adjusted at the beginning. In fact, most commonly the EventSequence's settings is *locked down* after the StartEvent has concluded its propagation.
 
There are several benefits for fixing an EventSequence's settings up front.

1. EventSequences are **predictable** when the same settings apply for their entire duration. This helps the developer both during design and debugging.

   There are exceptions to this rule. Settings controlling which actions to be taken *after* the EventSequence ends (cf. `preventDefault()`), might be equally or better controlled from the EndEvent. It *might* also be beneficial to control some settings concerning the granularity of events from recurring EventSequence events, for example the throttle frequency of a `throttled-resize` event. But, most settings are *locked down* from the start.
   
2. Reading CSS event sequences depends on `getComputedStyle()` (cf. CssControlEvent). This function is costly, and its use should therefore be kept at a minimum. If such settings are read *only* during the StartEvent, then this helps keep the EventSequence's footprint small.

   Again, no rule without exceptions. It *might* be possible/preferable to delay reading the CssControlEvent settings until the EndEvent. But, most of the time an EventSequence has several settings, and then:
    * it will be confusing if some settings, but not other's can be changed *during* an EventSequence's life-cycle, and
    * it likely will require calling `getComputedStyle()` at both the StartEvent and the EndEvent, as the EventSequence gradually develops over months and years.
    
## A StartEvent's tasks

1. *Before* the StartEvent is dispatched, it should call `getComputedStyle()` and read all the relevant CSS settings (if the EventSequence employs the CssControlEvent pattern, of course).

2. The StartEvent type should provide GetSetEvent methods that enables the event listener function capturing it to set and control the settings of the current EventSequence loop. GetSetEvent methods *can* override CSS settings, when relevant.

3. Dispatch a StartEvent.

4. Set PseudoPseudoClasses, if applicable.

5. To ListenUp, if need be.

## Demo: `long-press-start`



## References:

 * 