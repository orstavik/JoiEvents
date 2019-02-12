# JoiEvents
 *compose events like a native!*

## Introduction

1. [HowTo: Compose Events](/docs/1_Intro/HowTo1_composeWithEvents)
1. [HowTo: Combine Events and JS](/docs/1_Intro/HowTo2_EventsAndJs)
1. [HowTo: Combine Events and HTML](/docs/1_Intro/HowTo3_EventsAndHTML)
1. [HowTo: Combine Events and CSS](/docs/1_Intro/HowTo4_EventsAndCss)

## Event to event composition

5. [HowTo: Listen](/docs/2_EventToEvent/HowTo_listen)
5. [Pattern: EventComposition](/docs/2_EventToEvent/Pattern1_EventComposition)
5. [Problem: StopPropagationTorpedo](/docs/2_EventToEvent/Problem1_StopPropagationTorpedo)
5. [Pattern: EarlyBird](/docs/2_EventToEvent/Pattern2_EarlyBird)
5. [Pattern: PriorEvent](/docs/2_EventToEvent/Pattern3_PriorEvent)
5. [Pattern: AfterthoughtEvent](/docs/2_EventToEvent/Pattern4_AfterthoughtEvent)
5. [Pattern: ReplaceDefaultAction](/docs/2_EventToEvent/Pattern5_ReplaceDefaultAction)
5. [Pattern: ReverseGlobalization](/docs/2_EventToEvent/Pattern21_ReverseGlobalization)

## Event translation

13. [Pattern: AttributeFilteredEvent](/docs/3_EventTranslationAndRouting/Pattern6_AttributeFilteredEvent)
13. [Pattern: TypeFilteredEvent](/docs/3_EventTranslationAndRouting/Pattern7_TypeFilteredEvent)
13. [Pattern: DetailsOnDemand](/docs/3_EventTranslationAndRouting/Pattern8_DetailsOnDemand)
13. [Pattern: MergedEvents](/docs/3_EventTranslationAndRouting/Pattern9_MergedEvents)
13. [Pattern: SpecializedEventInterface](/docs/3_EventTranslationAndRouting/Pattern18_SpecializedEventInterface)

## EventSequence patterns

18. [Pattern: TakeNote](/docs/4_EventSequence/Pattern10_TakeNote)
18. [Pattern: PayAttention](/docs/4_EventSequence/Problem2_PayAttention)
18. [Pattern: ListenUp](/docs/4_EventSequence/Pattern11_ListenUp)
18. [Pattern: EventAttribute](/docs/4_EventSequence/Pattern12_EventAttribute)
18. [Pattern: MarkMyValues](/docs/4_EventSequence/Pattern17_MarkMyValues)
18. [Pattern: DebounceEvents](/docs/4_EventSequence/Pattern16_DebounceEvents.md) (todo)

## Gestures: mouse

24. [HowTo: drag'n'drop](/docs/5_MouseGestures/HowTo_DragNDrop)
24. [Pattern: GrabTarget](/docs/5_MouseGestures/Pattern13_GrabTarget)
24. [Pattern: GrabMouse](/docs/5_MouseGestures/Pattern14_GrabMouse)
24. [Pattern: MouseJailbreak](/docs/5_MouseGestures/Pattern19_MouseJailbreak)
24. [Pattern: CancelClick](/docs/5_MouseGestures/Pattern20_CancelClick)
24. [Event: `long-press`](/docs/5_MouseGestures/Event_long-press)
24. [Event: mouse `dragging`](/docs/5_MouseGestures/Event_dragFling)

## Gestures: touch

31. [Problem: SloppyFingers](/docs/6_TouchGestures/Problem1_sloppy_fingers)
31. [Problem: GestureStuttering](/docs/6_TouchGestures/Problem2_gesture_stuttering)
31. [Problem: TouchTheMouse](/docs/6_TouchGestures/Problem3_touch_the_mouse)
31. [Problem: ConflictingGestures](/docs/6_TouchGestures/Problem4_conflicting_gestures)
31. [Problem: CoarseSensors](/docs/6_TouchGestures/Problem5_coarse_sensors)
31. [Problem: TapDance](/docs/6_TouchGestures/Problem6_TapDance)
31. [Pattern: GrabTouch](/docs/6_TouchGestures/Pattern15_GrabTouch)
31. [Problem: WebDemocracy](/docs/6_TouchGestures/Problem7_WebDemocracy)
31. [Anti-pattern: RejectionBuildup](/docs/6_TouchGestures/AntipatternX_RejectionBuildup)
31. [Event: touch `dragging`](/docs/6_TouchGestures/Event_dragFling)
31. [Event: `swipe`](/docs/6_TouchGestures/Event_swipe)
31. [Event: `pinch` & `.spin()`](/docs/6_TouchGestures/Event_pinchSpin)

## Routing

43. todo add navigation control freak
43. todo add the patterns on hash-based routing
43. todo add the patterns on slash-based routing
43. todo move in from chapter on translate events

## todo

99. add chapters on proposals for the platform: add a `queJsTaskBeforeNextEventOrDefaultAction()` 
    or `addTailEvent()`. This should be in 2 along side ReplaceDefaultAction.
99. fix the different long-press events so they are source code.

## Vocabulary

In this project/book, we use the following definitions.

 * **event**: something happening in the browser. DOM Events being dispatched is an event, of course,
   but a callback triggered or native system task executed are also generally speaking an event.
 * **DOM Event**: an event that is triggered by one or more other events. Some native system tasks
   such as browser navigation, (cf. defaultAction or native behavior) can often be considered an
   invisible DOM Event.
 * **Composed event**: a DOM Event that is triggered by one or more other DOM Events.
 * **Triggering event**: a DOM Event that will initiate the dispatch a new composed event.
 * **Atomic event**: a DOM event that is not triggered by any other DOM events.
 * **Event sequence**: a series of triggering events that when following a specific order 
   will dispatch a composed event.
 * **Preceding event**: a DOM Event that propagates before another DOM Event.
 * **Trailing event**: a DOM Event that propagates after another DOM Event.
 * **Event Triggering function**: a (set of) functions that capture DOM events and dispatch composed events.
   The triggering function is at the very start of a triggering event's propagation: 
   added a) globally (ie. to `window`) and b) in the capture phase of the propagation.
 * **Native events**: DOM Events created by the browser.
 * **Custom events**: DOM Events created by a script.
 * **Global events**: DOM Events that can apply to HTML elements in the entire DOM.

## Personal comment
I was surprised to find how rarely EventToEventComposition is used. 
It made me second guess my self.
And, while I pursued these second guesses, I became even more surprised. 

Firstly, many native events follow the EventToEventComposition pattern. 
Through its actions, the platform implicitly, but still quite strongly, advocates using this pattern. 

Second, pursuing this pattern reveals several flaws in other approaches and several large benefits 
for EventToEventComposition: 
 * extreme ease of reuse, both across apps and within apps; 
 * extremely low coupling to other parts of the code;
 * super clear interfaces yielding less confusion, misuse and general anxiety;
 * and lightDOM composeability, ie. you can combine events from the same vantage point as you can native elements. 

Yet, for some reason, almost no one uses this approach! Why is that? 
I really don't know. ¯\\\_(ツ)\_/¯


## Test

<script async src="//jsfiddle.net/orstavik/8byg1o6s/1/embed/html,result/"></script>

## Test 2

<iframe width="100%" height="300" src="//jsfiddle.net/orstavik/8byg1o6s/1/embedded/html,result/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>