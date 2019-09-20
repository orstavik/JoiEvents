# Pattern: AudioFeedback

The AudioFeedback pattern builds on the SelectFeedbackElement. But we add some extra guidelines:

1. the default setting for audio feedback should be `none` or `mute`, for both on-screen and off-screen gestures.

2. Most EventSequences should implement support for audio feedback, except when the EventSequence does not need any other CssControlEvent settings.

## HowTo: describe sound?

Sound can be described as a reference to an audio file, such as `ding.mp3`. However, sound can also be described as a sequence of oscillators and filters. In this demo, we do just that.



Audio feedback for such off-screen events *can* be controlled in the app layer in the same way as for on-screen events. However, off-screen events should likely have:
1. a default audio feedback that should reside in the platform layer,
2. some settings for the default audio feedback, such as volume and maybe a set of alternative sounds, and thus
3. the ability to turn off the default audio feedback if a custom feedback is added in the app layer.

We process these requirements bottom up. 

 * If the volume is set to `0`, this means sound is off. If a sound alternative `none` is chosen, this means no sound.

 * specifying volume and choosing one sound from a set of pre-existing choices can and should be done as CSS properties, cf. the `cursor` property.
 
## Demo: TinCan

todo this is completely not implemented

This demo require patterns from the coming chapter on motion- and orientation events. And a touch-press.js event listener that will dispatch events such as press-start, press-change, press-end. 

```html
<script src="demo/touch-press.js"></script>
<script src="demo/shake.js"></script>

<div>
When four fingers are pressed on screen, the shake event is activated. 
</div>
```

We need to make a demo for a 

## References

 * []()