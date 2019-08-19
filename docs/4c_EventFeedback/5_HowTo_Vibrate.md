# HowTo: Vibrate

## Why use audio?

Audio feedback on the web are usually confined to three sets of use cases:

1. Alerts, such as ringtones and alarms. Gets the users attention about an external event happening in an app that is *not currently in use*.

2. Physical feedback, such as mechanical click sounds from keyboards and mice.

3. App-specific feedback, such as sounds in games and other "rich" web apps.

## Why not use audio?

Audio is commonly *not* used as feedback about gesture state. Software mediated feedback for gestures:
1. the user is already actively engaged with the app,
2. software-mediated, and
3. for generic use-case that can be applied to many apps, including normal, "not-rich" apps*, 

does by convention not rely on audio. Why?

1. Originally, back in the 90's, not every PC had sound. This meant that the first conventions for gesture feedback could only rely on the screen, not speakers. 
2. Even though most hardware supports audio today, it may still not be available: sound might cancelled out by either background noise or volume settings. 
3. Audio is obtrusive. Constant audio is stressful. (Note: maybe constant visuals and visual change should also be considered stressful?). 
4. Smartphone speakers are public. If you sit on a bus or lie in bed, you don't want the person next to you to hear your interactions with the phone.

## HowTo: audio feedback

Thus, to give audio feedback from generic gestures is not considered good practice. But, if your app is already cast as a "rich" web app, then adding an audio feedback to a generic composed event within it (such as a touch-based drag), might be strongly desirable.

So, which strategy to add audio feedback to a gesture? Should we implement support for audio in the composed event itself? Or should we control audio from the outside?

The benefit of adding audio control to the event itself would be its small footprint in your app's code. The reusable, composed event would only be slightly more complex, and all your app would need is to call a `setAudioFeedback()` in the gesture's start event (cf Pattern: setVisualFeedback). 

But, adding audio feedback in a rich app is often more complex. The sound being added might need to be coordinated with a "soundscape" rhytmically: ie. you might wish to time the start of the sound based on the `ms` timing of other ongoing music in the app, and not based on timing of the users event. 

And, you might need to change the sound fluently during the course of a gesture, not just turn it on/off. Imagine for example a game where you drag the string of a bow to shoot arrows at a target. The longer you drag, the higher the volume on a drag feedback tone; and when you change the angle of the drag, you change the pitch of this tone. In such use-cases, you need direct programmatic access to the API controlling the sound, and you do *not* want this audio api to be encapsulated into something else.
 
The conclusion is that:
1. because audio feedback is conventionally considered part of the app layer, and *not* the platform layer, and 
2. because implementing audio feedback often would require coordination with a rich app's soundscape and other state external to the event itself, and
3. because the audio feedback often would require low level control,

you should implement audio feedback in event listeners in the app layer. The composed events need to provide events that for event state changes. For example, in our "bow and arrow"-game the app needs events for drag-start, drag-move, drag-end to be able to control the sound correspondingly. The composed event does not need to implement for example a `setAudioFeedback(mp3)` method.

## References

 * []()