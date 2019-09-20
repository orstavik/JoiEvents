# Intro: Feedback

Most systems make a noice, change visual appearance or give another physical response when a user interacts with it. For example, when you flip a light switch, it makes a click sound, you can see a light coming on plus the switched switch, and you can feel the spring snapping as the switch flips under your fingertips. The sound, visual change, or reactive motion from the system we call **feedback**.

In UX feedback is critical. If you enter a room with the light switched on, you don't flip the switch to turn the light on. Obviously. But, there are other subtle design requirements for UX feedback too. For example, if a key or switch is so soft or hard that a user doesn't feel it move, then he/she might press too hard, too long, or simply give up. If a car backing is too silent, then people behind it might not react to it before it is too late. And if a switch looks the same in both on/off, and you can't turn the light on, then how can you tell which is broken: the lightbulb or the switch?

A user relies on feedback ques from a system when he/she interacts with it. The feedback from the system is input in his/her decision making process. The system being controlled gives feedback such as sounds, visuals and motion back to the control process; the control process uses these feedback queues to assess the state of the system, and based on this state, the control process makes a decision about how to direct the system further.

## Feedback loops

In machine mechanics, many systems integrate feedback about the state of the system into automatic controls. For example, a lawn mower can automatically regulate the influx of fuel based on the rpm that in turn reflect the amount of gras resistance.
https://www.briggsandstratton.com/eu/en_gb/support/faqs/browse/governor-system.html
Even simpler, some keel designs can automatically right a boat, even when the boat has capsized.

Such "automatic" feedback loops also exists when humans actively control a machine. At first, it might make less sense to think of feedback loops as automatic when a human is controlling the system. After all, human decisions are not "automatic". But, that is only partly true. Think of a car with a manual gearbox. Such a car can go for many miles, changing gears many times, without its driver ever being conscious about its gears. Changing gears is "automated" in the mind of the driver. He instinctively both register the sounds of the engine, the response to the gas pedal, the rpm dial, and his right arm/left foot swing into action with the same amount of consciousness as if he was bending his knee during a walk.

So, humans often observe system feedback subconsciously. And humans often control parts of a system subconsciously. 

## Web UX feedback loops

A web app can have many feedback loops.

1. Some feedback loops are driven by the app's domain logic. The domain logic (or business logic) of an app has to do with the particular purpose of that app. For example, in a tetris-like game, the domain logic controls the game, the game objective, and the game moves. When the user rotates the active game piece, it will alter the state of that piece in the state of the game, and the user will get a visual feedback of the piece having rotated on screen. Whenever the user clears a level, the web app chimes a heroic little bell. These feedback loops are grounded in the app/domain-logic, and the feedback given to the user is dependent on the domain-logic state of the web app.

2. A web app can also have event feedback loops more directly associated with input devices. When the user moves the mouse, the mouse pointer on screen moves accordingly. Whenever the user scrolls, a scrollbar appears and moves at the edge of the screen/element. These feedbacks are grounded in the conventions for input devices, and implemented *natively* in the browser/OS layer or *generically* in a library or platform. The feedback given the user is *not* dependent on the domain logic state of the app.

3. Finally, feedback given to the user can be physical and direct. When you hit CAPS LOCK hard with your left fist, as an appropriate introduction to your coming tweet, you both hear and feel in your skin and bones the transfer of pain that will be mediated from you via your machine hardware. With the touch interface of the slick smartphones there is less such physical feedback, and thus more pressure on the device to implement visual or auditive queues to feedback to the user what the system perceives the user doing.

## Event feedback loops



A feedback loop is a running system where some aspects of the system's output is recycled as input to the system and used to control the future running of the system.

The value of any web application is determined not only by the ability to accurately and efficiently solve the task, 
but also by how easy and convenient this application can be used. 
Even the simplest, and at the same time, the functional application will be unclaimed, if the user at work with it 
quickly becomes tired, irritated, feels uncomfortable. 

In this case, the user usually makes more mistakes and works less productively. For a more comfortable and efficient
 non-contact interaction with device, the user needs additional feedback. 

*Feedback* is a reflection of the user's login action back to the user. Feedback can be a natural side-effect, such 
as tactile sensations and sounds heard when you press a finger on the keyboard. But feedback can also be obtained, 
for example, by using the type of cursor that moves around the screen. Normally (when entering text), the appearance
of the cursor is seen by the user as an invitation to enter data and indicates the position from which the characters 
typed from the keyboard will be displayed on the display screen. The shape of the cursor often indicates the current
character input mode (bottom underline - insertion mode, rectangle - overlay mode). 
> `Feedback` - the influence of the result of functioning of any system on the character of further functioning.  


There are two types of user gesture feedback loops:

* `Direct feedback`, is always done when the input event is registered.
 
 1. Direct feedback should be fine grained, immediate, unobtrusive.
 2. Direct feedback is dependable, the user will receive it regardless of the event being successful or not. This means
   that sounds should be made in all directions of movement, not just "the right one" for motion gestures.
 3. The direct feedback should be universal. The user should recognize it across apps. This also makes it possible and 
  desirable to reuse them.
  
* `Indirect feedback`, is the user perceiving the state change that occurs as a consequence of the browser or app 
changing due to a specific reaction to the input.

 1. Indirect feedback is not dependable. It likely occurs only *after* a successful interaction gesture is completed, not 
during the gesture. To rely on indirect feedback does not enable the user to correct his or her behavior or to know if 
the problem is with the execution of the gesture or the sensoring of the gesture.
 2. Indirect feedback is part of the app logic (even when that app is the browser on the os). It should not necessarily 
be esoteric, but it can be.

 <p align="center">
     <img src="./img/feedbackLoop.png">
   </p><br>
   
When a user interacts with a web app, it is possible to use several input devices: mouse, keyboard, touch, camera, and
device motions. Any user action from these different input devices are registered as events inside the browser, and the
browser then responds to the event appropriately. Examples of such appropriate reactions can be: 
* Hovering with the mouse over an element can cause it to change style 
* touching a link element on a touchscreen will be interpreted as a click which makes the phone navigate to a new page 
* pressing a key on the keyboard will produce a letter in the input element in focus on screen. 


The feedback reactions are also universal. Feedback are more or less the same across all apps, all browsers, and all 
applications. Sure, feedback signals can be altered: wearing gloves while typing will alter feedback; and the mouse 
pointer and scrollbar can both be hidden and changed. But in general, the feedback reactions remain universal, 
omnipresent and thus non-intrusive. The feedback main function is to enable the user to control and correct his or her
own actions. The feedback are not directly relevant, neither for the browser nor the app nor the user: it is neither
entertaining nor meaningful to watch the mouse pointer move around the screen. The feedback is only indirectly relevant
as it helps the users control their own actions.

 The feedback is "guiding signals": they are unobtrusive and do not grab the users attention. The user's perception 
of them are meant to be automated so that the user can perceive them without giving them conscious focus. The mouse 
and text cursor achieve this feat by always being the same familiar, boring, small, icons that becomes consciously 
invisible although always in the foreground. The scroll bar achieves this by staying in the edges, in our peripheral 
vision. Thus, the buttons of various dialogs in the standard window interface can be interpreted as signals to their 
pressing. But these signals are extremely weak, because all the buttons look the same, differing only in the texts in
them, and they have different functions. That is, out of all the variety of visual media - shape, size, color, 
text - in the buttons dialogs used only text.