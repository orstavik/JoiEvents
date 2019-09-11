# JoiEvents
 *compose events like a native!*

<a href="https://orstavik.github.io/JoiEvents/">Read the book and enjoi!</a>

## Vocabulary

 * **OS Event**: something happening in the browser. DOM Events being dispatched is an event, of course,
   but a callback triggered or native system task executed are also generally speaking an event.
 * **Event**: a DOM event that is either triggered by an OS Event or dispatched by a JS script.
 * **Global events** begin their propagation on the `window` object (capture phase).
   Global events commonly have `{bubble: true, composed: true}`, but they can also be dispatched 
   directly on the `window` object.
 * **Local events** are all events that do *not* begin their propagation on the `window` (capture phase).
 * **Native events** are created by the browser.
 * **Custom events** are created by a script.
 * **Preceding event** propagates *before* another event.
 * **Trailing event** propagates *after* another event.
 * **Composed event** is triggered by one or more other events.
 * **Trigger event** is an event that initiates a new composed event.
 * **Atomic event** is not triggered by any other events, but something else.
 * **Event sequence**: a series of ordered trigger events that combine to dispatch a composed event.
 * **Event listener**: a JS function that is triggered by the occurrence of an event.
 * **defaultAction**: a native function built into the browser that is triggered when an event 
   completes propagation.
 * **Composed event function**: a group of functions that together implement a composed event.
 * **Trigger function**: one of many event listener functions that make up a composed event function.
   Trigger functions capture events, processes them, and most often dispatch a new composed event.
 * **Initial trigger function**: a trigger function that initiates a composed event sequence and can 
   register a group of secondary trigger functions for other events. The initial trigger functions are
   active when the composed event function is listening and not yet activated, and the initial trigger
   functions activate the composed event function.
   Initial trigger functions are commonly added to the `document` in the capture phase.
 * **Secondary trigger function**: trigger functions that are activated when a composed event 
   function is activated, and deactivated when the composed event function is deactivated. 
   Secondary trigger functions are commonly added to the `window` in the capture phase.

## Introduction

1. [HowTo: Compose Events](docs/1_Intro/HowTo1_composeWithEvents)
1. [HowTo: Combine Events and JS](docs/1_Intro/HowTo2_EventsAndJs)
1. [HowTo: Combine Events and HTML](docs/1_Intro/HowTo3_EventsAndHTML)
1. [HowTo: Combine Events and CSS](docs/1_Intro/HowTo4_EventsAndCss)

## Event to event composition

5. [HowTo: Listen](docs/2_EventToEvent/1_HowTo_listen)
5. [Intro: EventComposition](docs/2_EventToEvent/2_Intro_EventComposition)
5. [WhatIs: propagation](docs/2_EventToEvent/3_WhatIs_propagation)
5. [HowTo: StopPropagation](docs/2_EventToEvent/4_HowTo_StopPropagation)
5. [Pattern: CancelClick](docs/2_EventToEvent/5_Pattern20_CancelClick)
5. [Pattern: EarlyBird](docs/2_EventToEvent/6_Pattern2_EarlyBird)
5. [Pattern: PriorEvent](docs/2_EventToEvent/7_Pattern3_PriorEvent)
5. [Pattern: AfterthoughtEvent](docs/2_EventToEvent/7_Pattern4_AfterthoughtEvent)
5. [Pattern: ReplaceDefaultAction](docs/2_EventToEvent/9_Pattern5_ReplaceDefaultAction)
5. [Problem: PayAttention](docs/2_EventToEvent//10_Problem2_PayAttention)
5. [Pattern: ReverseGlobalization](docs/2_EventToEvent/11_Pattern21_ReverseGlobalization)
<!--
99. chapter 2 proposals for the platform: `postPropagationCallback(cb(e))`. 
5. Problem: StopPropagationTorpedo - docs/2_EventToEvent/Problem1_StopPropagationTorpedo
-->

## Event translation

13. [Pattern: AttributeFilteredEvent](docs/3_EventTranslationAndRouting/Pattern6_AttributeFilteredEvent)
13. [Pattern: TypedEvent](docs/3_EventTranslationAndRouting/Pattern7_TypedEvent)
13. [Pattern: DetailsOnDemand](docs/3_EventTranslationAndRouting/Pattern8_DetailsOnDemand)
13. [Event: `link-click`](docs/3_EventTranslationAndRouting/Event_linkClick)
13. [Pattern: SpecializedEventInterface](docs/3_EventTranslationAndRouting/Pattern18_SpecializedEventInterface)
13. [Pattern: MergedEvents](docs/3_EventTranslationAndRouting/Pattern9_MergedEvents)

## EventSequence patterns

18. [Pattern: TakeNote](docs/4_EventSequence/Pattern10_TakeNote)
18. [Pattern: PayAttention](docs/4_EventSequence/Problem2_PayAttention)
18. [Pattern: ListenUp](docs/4_EventSequence/Pattern11_ListenUp)
18. [Pattern: EventAttribute](docs/4_EventSequence/Pattern12_EventAttribute)
18. [Pattern: MarkMyValues](docs/4_EventSequence/Pattern17_MarkMyValues)
18. [Pattern: ShowGestureState](4_EventSequence/Pattern23_ShowGestureState) (todo)
18. [Pattern: DebounceEvents](docs/2_EventToEvent/Pattern16_DebounceEvents.md) (todo)

## Gestures: mouse

24. [HowTo: drag'n'drop](docs/5_MouseGestures/HowTo_DragNDrop)
24. [Pattern: InvadeAndRetreat](docs/5_MouseGestures/Pattern4_InvadeAndRetreat)
24. [Pattern: GrabTarget](docs/5_MouseGestures/Pattern13_GrabTarget)
24. [Pattern: GrabMouse](docs/5_MouseGestures/Pattern14_GrabMouse)
24. [Pattern: MouseMoveTrap](docs/5_MouseGestures/Pattern19_MouseMoveTrap)
24. [Pattern: MouseDoubleDown](docs/5_MouseGestures/Pattern26_MouseDoubleDown)
24. [Pattern: AlertBlurCall](docs/5_MouseGestures/Pattern25_AlertBlurCall)
24. [Event: `long-press`](docs/5_MouseGestures/Event_long-press)
24. [Event: mouse `dragging`](docs/5_MouseGestures/Event_dragFling)

## Gestures: touch

31. [Problem: SloppyFingers](docs/6_TouchGestures/Problem1_sloppy_fingers)
31. [Problem: GestureStuttering](docs/6_TouchGestures/Problem2_gesture_stuttering)
31. [Pattern: TouchendPreventDefault](docs/6_TouchGestures/Pattern_TouchendPreventDefault)
31. [Problem: ConflictingGestures](docs/6_TouchGestures/Problem4_conflicting_gestures)
31. [Problem: CoarseSensors](docs/6_TouchGestures/Problem5_coarse_sensors)
31. [Pattern: PassiveAggressiveTouchstart](docs/6_TouchGestures/Pattern_PassiveAggressiveTouchstart)
31. [Pattern: GrabTouch](docs/6_TouchGestures/Pattern15_GrabTouch)
31. [Problem: WebDemocracy](docs/6_TouchGestures/Problem7_WebDemocracy) (todo)
31. [Anti-pattern: RejectionBuildup](docs/6_TouchGestures/AntipatternX_RejectionBuildup) (todo)
31. [Event: touch `dragging`](docs/6_TouchGestures/Event_dragFling)
31. [Event: `swipe`](docs/6_TouchGestures/Event_swipe)
31. [Event: `pinch` & `.spin()`](docs/6_TouchGestures/Event_pinchSpin)

## Routing

43. todo add navigation control freak
43. todo add the patterns on hash-based routing
43. todo add the patterns on slash-based routing
43. todo move in from chapter on translate events     
43. https://instant.page/ try to use an event listener for mousemove that detects when 
    the mouse cursor slows down over an element.

## todo

99. fix the different long-press events so they are source code.

## Personal comment
I was surprised to find how rarely EventComposition is used. 
It made me second guess my self.
And, while I pursue these second guesses, I became even more surprised. 

First, many native events follow the EventComposition pattern. 
Through its actions, the platform advocates *for* this pattern, implicitly, but strongly. 

Second, pursuing this pattern reveals several flaws in other approaches and several large benefits 
for EventComposition: 
 * extreme ease of reuse, both across apps and within apps; 
 * extremely low coupling to other parts of the code;
 * super clear interfaces yielding less confusion, misuse and general anxiety;
 * and lightDOM composeability, ie. you can combine events from the same vantage point as you can 
   native elements. 

Yet, for some reason, few use this approach! Why is that? 
I really don't know. ¯\\\_(ツ)\_/¯

## Test

<script async src="//jsfiddle.net/orstavik/8byg1o6s/1/embed/html,result/"></script>

## Test 2

<iframe width="100%" height="300" src="//jsfiddle.net/orstavik/8byg1o6s/1/embedded/html,result/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>