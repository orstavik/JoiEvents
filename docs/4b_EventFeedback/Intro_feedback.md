# WhatIs: Feedback

Most systems either makes a sound, moves, or change appearance when a user interacts with it. For example, if you flip a light switch, it a) makes a click sound, b) your finger feels how the switch changes physical position, c) light appears, and d) you can even see the switch has been flipped. These responses are feedback to the user of the the light switch system.

**Feedback loops** are systems that directly integrate feedback in their controls. For example, lawn mowers control their engine speed automatically via a mechanical governor “that uses gears and flyweights inside the crankcase to detect changes in the load and adjusts the throttle accordingly”. Boat keels can be designed so as to right a boat automatically if it capsizes. In feedback loops, system output such as RPM and boat orientation is input for the control system when it directs the further running of the machine.

# Humans in feedback loops

We humans like to think that when we are using a machine, we are not part of a feedback loop. We like to think that the machine presents us with information about its state, and then we make independent, conscious decisions based solely on what we want. We feel smart and free and in control. We do not think that the machine partially is controlling us. 

Obviously, this is wrong. Human decisions are most often much more instinctive and automatic than controlled and deliberate. We react to what we see, hear and feel, Instinctively. Automatically. Just think about riding a bike. At first, the responses and feedback from the system require conscious and deliberate actions on your part. To learn how to ride a bike is hard. But, after a while, you train your mind to automatically adjust to the bike’s handlebars, pedals, breaks and gears. At that point, the human mind and the bike machine functions as a feedback loop: your mind/body will automatically right the feedback from the bike tells the mind that the bike is about to tilt.

Web user interfaces are full of such feedback loops. If you have worked with computers for some time, then you rarely think consciously about the mouse pointer. Sure, you decide where to go with the bike and what to click on with the mouse, but at a lower level, the process of riding the bike or pushing the mouse is automatic.

These feedback loops are planted by developers and grow gradually as more and more users automate both the individual actions and sequences of actions as gestures. This means that when we design UX and composed events, we must not only think of them as a sequence of actions a user will consciously manage, but as gestures that the user strives to automate. When a user encounters a web interface, he/she will also automatically use his/her established automated gestures to navigate and direct the web interface machine. Ie. if the user wishes to navigate to something, he/she will try to click it; the user might automatically assume that more items and choices are available below the screen, and thus try to scroll.

This process of automation is very important when designing the UX of gestures and composed events. Often, a new composed event is conceptually related to an established UX gesture that many users have automated. For example, a `long-press` composed event might simply generalize a gesture on the OS layer of most smartphones today and transfer it to the web. In such cases, the composed event must echo both the **behavior and feedback conventions** of the OS gesture so that users do not need to *think about* what is happening at the micro level of the interaction. Another example is a composed `pull` event. The pull-down-to-refresh is an established convention in many apps, and if this concept is generalized so as to be applicable to any element, and in all directions, then the user might immediately, or very quickly, translate his existing, automated use of pull-down-to-refresh into a set of other pull-in-a-direction-to-do-something skill.

## Humans need feedback on the web

> A gesture is a set of actions spread out over time. We implement gestures as event sequences. 

Gestures and composed events need to give users feedback about their state. For example, a touch drag is comprised of the user pressing down on the screen, moving his/her finger in a direction while pressing down, and then lifting up his/her finger. During such a gesture, its state changes. Before the finger is pressed down, the gesture is inactive. After the finger is pressed down, the user might start either a click or a drag. While the finger is dragged over the screen, the drag is active. And when the finger is lifted, the gesture is again inactive.

But, during a gesture it might not be unequivalently clear what actions has been performed/registered? Did the finger start the drag gesture from element A or B? How far has the drag been executed? Exactly over which element is the drag concluded? And what will be the end interpretation of this drag gesture? 

The user needs feedback to answer all such questions, and the first form of feedback the user gets from the web is physical: hardware feedback.  

### Hardware feedback

Until machine interfaces can read our brain waves directly, we need to physically interact with the machine via touch, talk, or gestures. The physical user actions not only control the machine, but can also themselves be observed directly by the user himself: if you say something to a smart speaker, you will hear it yourself; if you click on a key, you can both hear and feel the click. Physical feedback is truly immediate, ie. non-mediated *and* fast.

Hardware feedback may suffice. A blind light switch user can be confident that his action is completed by just feeling and hearing the light switch snap. You can see the position of your finger on a smartphone screen. You can feel the finger move down and up when tapping.

However, hardware feedback is often inadequate on the web. The web is a myriad of web apps on top of universal computers and browsers: did I press the “a” or “caps lock” just now on the keyboard? Did the phone register my finger gesture as a click or a drag? When feedback from the hardware is not enough, we need software-mediated feedback.     

### Software feedback

The app, browser and OS can alter the view, play sounds, vibrate, etc. to give users extra feedback on input. This extra feedback is mediated by software, thus software feedback.

There are a couple of distinctions that can be useful in order to understand software feedback. 
1. Feedback can give details about: 
   1. the state of a gesture, ie. the state of a sequence of input actions, and
   2. the state of the app, ie. state that not only include direct input from the user, but also the domain logic and data from the app.
2. The processing of user feedback can be implemented on the layer of
   1. the platform, ie. reusable and generic across many different apps and use-cases, and
   2. the app, ie. with access to app specific data and customizable to particular use-cases.

Also, as a gesture grows more complex, the room for error and confusion grow exponentially. If a gesture requires a series of 5 different steps, the user needs more feedback about the state of the gesture than if a gesture comprise of only a single step.

## Composed event feedback

First, composed events have access to the state of the gesture. They can store and retrieve any data from previous events. Composed events cannot make any assumptions about the state of the DOM nor other app specific context.

There is one trick in this box. Composed events can access universally accessible browser state. Such as browser history. As long as the structure of the browser state is given, a composed event can for example distinguish between a links that has been visited or not. (todo make chapter about f.x. HoverVisitedLink and a chapter about a custom composed event that use some other generic aspect of the browser state).

Second, composed events are implemented at the platform level, as extensions of default capabilities of the browser. They implement support for conventionalized gestures not yet implemented in browsers. 

This might seem strongly limiting for the ability of composed events to give user feedback. However, it is not. In this chapter we will show how composed can give their users visual feedback, audio feedback and tactile feedback.

## References

 * []()

