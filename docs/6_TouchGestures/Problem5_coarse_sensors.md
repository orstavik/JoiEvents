# Problem: Coarse sensors

> TLDR: When touch devices struggle to distinguish between individual and multiple touches,
 users are confused. To avoid this problem in multifinger gestures, users can be signaled the state of touch sensors.

When users place two or more fingers too close, 
touch devices can and will struggle to differentiate between the individual touch points.
You can experience this problem yourself by closing your eyes and ask someone to press either 
one or two fingers in your palm and then guess how many fingers.
The sensors' problem gets bigger when:
* the sensors are fewer and wider apart (worse, older, cheaper),
* the finger gets smaller, and
* the harder/closer the fingers are pressed together.

## Pattern 3: ShowGestureState

Coarse sensors is a hardware problem. It cannot be solved in JS.
But, when you use multifinger gestures in your app, 
you can inform your users of the state of your gestures.

The pattern ShowGestureState is not meant to be applied to the trigger functions, but 
by the app using a composed or native gesture.
Signalling to the user if a gesture has started by giving an element a colored border,
or showing the user how many fingers are currently touching the screen can be a tool to guide your
users to correct use of a gesture and thus alleviate problems caused by coarse sensors or complex UX.

`touchstart`, `touchend` and "gesture-start" and "gesture-end" events are the most likely candidates 
to listen for, but "gesture-move" events might also cause changes to the view.
Altering the color of one or more sides of an already existing border on either the body or 
a specific element might be a good method to signal the state of a gesture.

## Example/Demo

## References

* Add good reference to the analogue and multiplexed nature of finger muscles and controlling nerves.