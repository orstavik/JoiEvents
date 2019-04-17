# Problem: PayAttention!

## What does it cost to listen for an event?

1. To compose an event, you need other events to compose them from (trigger events).
2. To get trigger events, you need to register a function that listens for them (trigger function).
3. This trigger function is attached as a global event listener.
4. And global event listeners need to run every time an instance of the trigger event is dispatched.
   And this will cost ya!

"How much?", you ask. "Well, that depends", I answer. "How much have you got left in your frame purse? 
And which trigger events do you want to pay to listen to? The price is not the same for all events, 
you know". Then I wink knowingly to you while I nudge you with my elbow.
I insinuate that we both know why and which events are more costly than others. 
Although we both know that you don't actually know much about the cost of event listening. 
But only I know that I don't really know the true cost of these events either, 
I only know enough about it to fool you into thinking that I do.

In reality, the cost of listening to an event differs wildly. 
Listening to a `click` is far less costly than listening for a `mousemove` or `change` event.
To assess the cost of event listening, we need some measurements:

1. **Event granularity**: Some events, such as `mousemove`, 
   `touchmove`, `mouseout`, `wheel`, `scroll`, `change` are *fine-grained*. They are likely dispatched 
   many times per second, possibly more than once per frame (> 60 per second). 
   Other events, such as `click`, `touchstart`, and `mouseup`, are *coarse-grained*. 
   These events are not likely dispatched in rapid succession, less than a handful of times per second.
   Many coarse-grained events are limited by the user abilities
   (try to `click` ten times per second, I dare you). 
   
2. **Platform**: If your app is designed for high-power desktops with modern browsers, you are rich.
   You have the means to pay for more event listeners. But, if your app should run on
   a poorer platform (old computer with IE or low-budget phones), 
   your definition of fine-grained and coarse-grained might change.
   `keypress` and `change` are examples of events that I would expect to be coarse-grained 
   on some platform and with some users, while fine-grained on other platforms and other users.
   
3. **Event rarity**: My salesman knowledge is here reaching its limitations. But, I anticipate that
   browsers can detect when the app has *not* registered any event listeners for such fine-grained, but 
   rare events such as `wheel`. When the app has *no* event listeners for such rare events, 
   then the browsers could also skip completely its preprocessing of such events.
   Thus, if you add an event listener for a rare event, the browser would not only need to process that
   event listener itself, but also need to preprocess an event which otherwise would have been skipped.
   Whether you think of it as quantum discount or a start-up fee, adding the first event listener for a 
   certain event type might incur an extra cost.
   
4. **Event collocation**: Some events crowd the same time-space.
   `dblclick` is dispatched at the same time as both `click` and `mouseup`. 
   These three events essentially needs to share the same timeframe. 
   This is rarely a problem for coarse-grained events, but for fine-grained events
   such as `mousemove`, `wheel`, and `hover` collocation is an added cost.
   
## How to pinch pennies?

At this point in the discussion, you would normally have gotten your wallet out and ready. 
You are feeling anxious about the cost, and your go-to penny-pinching-strategy is to end the 
transaction. 

However, this would be a mistake. What you are buying is not a thing, it is a subscription. 
To listen for events is not costly when you enter into the agreement. 
On the contrary, to subscribe to an event is most often free.
The cost comes *while* you are subscribing.

There are two patterns that can help us reduce the cost of listening for events:

1. [ListenUp pattern](../4_EventSequence/Pattern11_ListenUp) 
   minimize the cost of listening to fine-grained events in gestures and EventSequences.
   ListenUp is *very important* and will most likely reduce your event listening costs more than
   enough to cover your needs.
   
2. [ReverseGlobalization](Pattern21_ReverseGlobalization)
   minimize the cost of listening to events by localizing the event listener.
   This pattern will make the event listening as efficient as it can possibly be,
   and so if you are worried about maximum performance, this pattern will get you there.
   But, maximum performance will open your app to other costs:
   1. Localized event listeners are static. 
      You need to imperatively add and remove your event listeners, and
      if you alter your DOM, you might need to update them. 
   2. Localized event listeners are also vulnerable to [StopPropagationTorpedoes](Problem1_StopPropagationTorpedo.md).

## Discussion: Etymology and group psychology

Literally, to "pay attention" means that someone should "pay" to "attend".
Both "to pay" and "attend" comes from Latin. 
To "pay" means to give to another a scarce resource to get peace. 
To "attend" means something like "stretch to here and/or from there".
Thus, "pay attention" means that:
1. you should give me your concentration resource
2. that will allow you to virtually stretch your mind and point of view
3. *from* where you are standing and *over to* where I am standing 
4. so that *you* better can hear *my* words and see *my* world.

"Pay attention!" is a command. It is often uttered by authority figures such as teachers or officers 
to get their subordinates to follow directions and not doze off.
To give others commands feels good. You are in control, social control; 
You have underlings and therefore you are alpha.
However, commands can also backfire. 
If you cannot back up your verbal commands with other harsher means, 
it will likely be a prelude to your social failure and potential group collapse.

## References

 * 