# Pattern: ShowGestureState (UX)

Todo gestures should add html attributes to the target html element so as to signal state.
Todo add the gesture-name-active to illustrate that the gesture is active.
Todo add the gesture-name-active-property.
Todo remove the html property when the gesture has completed, remove all possible attributes.
Todo if there is no target selected, add the data to the body element. This means that maybe the body, and
Todo not the root html element should be used as the top most element??

## Pattern: ShowGestureState

When you use (multifinger) gestures in your app, 
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

## Native ShowGestureState

1. the native scroll -> a bar with a location on the right side
2. the native a href -> different mouse pointer on hover, different colors depending on history state.

## Custom ShowGestureState patterns

## Example/Demo

The borders have a color and width that can change when the gesture is active (has recently been active). 
This is what the browser does too, except a little 

1. Add a scroll bar at the top of the browser.

2. Add a top scroll bar and a right scroll bar on an image that is a map.

----- ~~~~ -----------
|
|
§     this is a map like image that you can zoom and pan around 
§      in the scroll bar (here top and left)
§      you see what area of the image you are located
|
|
|
|

3. extend the navigation with a different color/symbol for links that are cached, 
   that will be fast to navigate to.

## Problem: Coarse sensors

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

Coarse sensors is a hardware problem. It cannot be solved in JS. It will bleed into the UX experience,
and is best tackled using the ShowGestureState pattern.

## References

* Add good reference to the analogue and multiplexed nature of finger muscles and controlling nerves.