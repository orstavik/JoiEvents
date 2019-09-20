# HowTo: AudioFeedback

## When to use audio?

Audio feedback on the web are usually confined to four sets of use cases:

1. Alerts, such as ringtones and alarms. Gets the users attention about an external event happening in an app that is *not currently in use*.

2. Physical feedback, such as mechanical click sounds from keyboards and mice.

3. App-specific feedback, such as sounds in games and other "rich" web apps.

4. Off-screen UX, such as shaking the phone or flipping it upside down.

## When not to use audio?

Up until now, audio feedback has not been used as feedback for gesture state when the user:
1. is already engaged with the app,
2. has screen access,
3. performs a generic gesture that can be applied to many apps, including normal, "not-rich" apps. 

Why is that?

1. Originally, back in the 90's, few PCs had sound. This meant that the first conventions for gesture feedback relied on the screen, not speakers. 
2. Even though most hardware supports audio today, it may still not be available: sound might cancelled out by either background noise or volume settings. 
3. Audio is obtrusive. Constant audio is stressful. (Note: maybe constant visuals and visual change should also be considered stressful?). 
4. Smartphone speakers are public, and headset are often not available. If you sit on a bus or lie in bed, you don't want the person next to you to hear your interactions with the phone.
5. Common gestures today still imply on-screen access.

## HowTo: audio feedback on on-screen events

Thus, to give audio feedback from generic gestures that imply screen access is considered bad practice. But, if your app is already cast as a "rich" web app, then adding an audio feedback to a generic composed event within it (such as a touch-based drag), might still be strongly desirable.

So, which strategy to add audio feedback to a gesture? Should we implement support for audio in the composed event itself? Or should we control audio from the outside?

The benefit of adding audio control to the event itself would be its small footprint in your app's code. The reusable, composed event would only be slightly more complex, and all your app would need is to call a `setAudioFeedback()` in the gesture's start event (cf Pattern: setVisualFeedback). 

But, adding audio feedback in a rich app is often more complex. The sound being added might need to be coordinated with a "soundscape" rhytmically: ie. you might wish to time the start of the sound based on the `ms` timing of other ongoing music in the app, and not based on timing of the users event. 

And, you might need to change the sound fluently during the course of a gesture, not just turn it on/off. Imagine for example a game where you drag the string of a bow to shoot arrows at a target. The longer you drag, the higher the volume on a drag feedback tone; and when you change the angle of the drag, you change the pitch of this tone. In such use-cases, you need direct programmatic access to the API controlling the sound, and you do *not* want this audio api to be encapsulated into something else.
 
The conclusion is that for **on-screen gestures** should not implement audio feedback in event listeners in the app layer: 
1. because audio feedback is conventionally considered part of the app layer, and *not* the platform layer,
2. because implementing audio feedback often would require coordination with a rich app's soundscape and other state external to the event itself, and
3. because the audio feedback often would require low level control.

Thus, the composed events need to provide events that for event state changes. For example, in our "bow and arrow"-game the app needs events for drag-start, drag-move, drag-end to be able to control the sound correspondingly. The composed event does not need to implement for example a `setAudioFeedback(mp3)` method.

## HowTo: audio feedback for off-screen events

For off-screen events such as orientation- and motion-based gestures, audio often should be used as feedback. For example, if you shake your phone, you might wish to alert your user:
1. when the shake *can be* registered (maybe you need to press at least four fingers on the screen to activate the gesture?),
2. when the shake *is* registered,
3. when and how the shake changes state (when the phone moves up, the pitch moves up?), and
4. when the shake ends.

## Discussion

If and when audio is necessary, the app and/or user must decide. Off-screen gestures would need audio feedback more often than on-screen gestures. However, composed events and EventSequences should support audio feedback, but keep them mute by default. This would enhance their reusability, and would add little extra cost if the EventSequence already needs to call `getComputedStyle(..)` for other settings.

## References

 * []()