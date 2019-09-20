# Problem: GestureStuttering

> TLDR: GestureStuttering occurs because users can place multiple fingers on the screen 
either simultaneously or in quick succession.
To tackle this problem gestures relying on `touch` events need to IgnoreThenDoubleCheckAndCancel
in their `touchstart` listener. You are not mistaken if you consider this obvious.

Often, when a user initiates a multifinger gesture, 
he will place all the necessary fingers on the screen at the same time.
However, sometimes, instead of putting several fingers down on the screen at the exact same time,
a user might place his fingers on the screen in rapid succession.

For example, a user intends to perform a two-finger drag.
When the user places two fingers on the screen,
he might put one finger down slightly before the other finger.
This triggers *two* sequential initiating `touchstart` events, one for each finger.
However, next time the user's fingers might be more in sync, and both fingers are registered simultaneously.
This triggers only *one* single initiating `touchstart` event.

## Solution: IgnoreThenDoubleCheckAndCancel 

To solve this problem we simply ignore any irrelevant stutters. 
This means to simply not start recording any gesture actions 
if the potential trigger event (ie. `touchstart` or `touchend`)
does not correspond with the required number of active fingers/touches.

However, this solution has two consequences:
1. The start of the gesture is registered when the last required trigger event occurs.
2. The app might need to differentiate between gestures or cancel gestures
   depending on the delay between the triggering events.

In most cases, these consequences are not relevant.
Thus, to simply ignore irrelevant stutter is most often fine.
But, a few use-cases need more precise timing.
In such cases, the initial trigger functions for `touchstart` and `touchend` should not only ignore
GestureStuttering, but register its properties for later.

The threshold for how much stuttering should cause the gesture to be canceled, is likely to depend on
the user of the gesture. Therefore, an EventSetting attribute should be applied to enable the user
of the gesture to control the amount of accepted stuttering, in addition to a default value.

## References

* dunno