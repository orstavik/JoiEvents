# When: past- and future-tense events

> Normal mail and post also represent state changes. For example, bills are sent to announce a future state change: someone is about to owe someone else some money, soon; Christmas cards are sent to announce past state changes: this family is soooo happy and has evolved soooo much the previous year.

Events are not sent in the middle of a state change. Events are always dispatched either *before* or *after* a completed state change. For example, the `contextmenu` event is dispatched *before* the browser shows its native context menu; the `change` event is dispatched *after* an input element has changed its value. We divide such events in two categories:

1. **Past-tense events** announce a past, completed state change. Examples include:
   * the `toggle` event dispatched after a `<details>` element is `open`ed,
   * the `reset` event dispatched after a `<form>` is `.reset()`, 
   * the `dblclick` event dispatched after two quick `click`s,
   * many, many more.

2. **Future-tense events** announce a future, coming state change. Examples include:
   * the `click` event dispatched before the task of targeting a `submit` event at a `<form>`,
   * the `submit` event dispatched before the task of submitting a `<form>`s data to a server,
   * the `beforeinput` event dispatched before the task of altering the value of an input element has been carried out,
   * many, many more.
   
As the astute reader has noticed, can many events play the role of *both* past- and future-tense. In fact, all future-tense events represent a past-tense state change too:
* The `click` event not only announce the ensuing `submit` event, but also the preceding `mousedown` and `mouseup` event on a common DOM element.
* The `submit` event represents both a *past* state change (a submit button *has been* `click`ed) and a *coming* state-change (a form will be submitted).

Similarly, state changing tasks can be associated with any event during its life cycle thus making events that originally only announced *past* state changes, also trigger *future* state changes. In fact, this is the whole point of event listeners, adding potential state changing tasks for certain events. So, what does that make the past- and future-tense events?

Well, *an event* is either past- or future-tense from the standpoint of *a state changing action*. For example:
 * If you add an event listener for `click` events on a node in the DOM, then any `click` events that occur on that node will be a future-tense event from the vantage point of this event listener. If the `click` event's propagation is stopped *before* the event reaches the node for the event listener, then the function will not run.
 * The `reset` event is dispatched at the end of the `.reset()` function that resets a form. The `reset` event *has in essence ended* when the `reset` event propagates. From the vantage point of the `.reset()` function the `reset` event it dispatches when it concludes is *past-tense*.

Events are always viewed in relationship to state changes. They always follow a state change, and their purpose for being is to trigger yet other state changes. However, when you think about subscribing and dispatching events, having a clear idea of which events should precede and follow which state changing functions is.. a must.    

## What about *ongoing* state changes 

Regretfully, state changes often take time and/or have blurry definitions of their beginning/end. In these instances, events often need to be dispatched in what can be perceived like an ongoing state change. Let's look at some examples:

### Ongoing `mousemove`
  
On the face of it, moving the mouse seems intuitively divided into a series of individual past-tense `mousemove` events. The `mousemove` events are also "made" by the browser. But, there might be other better past-tense divisions:
* `mousemove` events are not evenly divided in the *space* of the state changes: the `mousemove` dots can be far apart when the user moves the mouse too fast.
* `mousemove` events are not evenly divided in the *time* of state changes: there are no `mousemove` events dispatched when the user holds the mouse still, and that means no way for a script to locate the mouse position.  
* `mousemove` events are frequent and thus costly for performance.

To reduce both a) the gaps in space between `mousemove` points and b) the need for frequent `mousemove` events, a `mousemove-vector` event could instead stipulate a movement vector which stipulated direction, curvature, speed, and acceleration, and only dispatch new `mousemove-vector` events whenever the mouse movement deviates from this path. Similarly, the current position of the mouse could be made available as a property in the browser. This would reduce the need for `mousemove` event listeners whose sole purpose is to track this position. A completed state change is not necessarily a fixed point in a state space, but could just as easily be considered changing a change of one or two vectors.

### 1x `wheel` => 10x `scroll`  

In the good old days of web programming, animation was achieved by altering the position of an element frame by frame. And, `scroll` still lives in this timezone. To scroll a page, the viewport is moved up and down, once per frame.

However, when you for example turn the `wheel` once up or down, this action is translated into a motion curve for the `document` element. To achieve this effect, the browser translates the `wheel` event into ~10 `scroll` events which in turn is spread across the next 10 animation frames and that moves the document up or down in the viewport according to an ease-in, ease-out motion.
  
Again, the state change of `scroll` could be viewed as a series of vectors, instead of points. If the `scrollTop` property could be animated the same way as a CSS style property, then instead of animating the `scroll` old-school as 10 discrete movements, once per animation frame, a single `scroll` event with a set of motion vectors could be dispatched.

### Update-in-place: the SUE pattern 
 
In web speak "changing state in-place" is close to a curse word in many situations. And it can bad. Really bad. However, sometimes "update-in-place" events are needed. For example, you need to know the progress of a (down-)loading task so you can depict a nuanced, optimistic progressbar, instead of an unreliable throbber. Or you might simply need to signal that a series of events are related, they are intended to be viewed as a codependent sequence.

Enter the SUE pattern. The SUE pattern cluster a series of smaller individual state changes under the umbrella of a bigger, holistic state change. The beginning and end of the big, holistic state change is marked with a `-start` and `-end` event. Between the `-start` and `-end` event a series of `-move` or `-update` events are filled in. `Start`,`Update`,`update`,`update`,`End` (ie. SUE). Each individual, smaller event signals its own past-tense state change. However, other functions can choose to view the SUE event sequence as *one* holistic, ongoing state change with events updating-in-place.  

There are several SUE implementations in the browser:
 * `dragstart`, `drag`, `dragend` events gives a holistic view of `mousedown`, `mousemove` and `mouseup` events for certain type of HTML elements.
 * `touchstart`, `touchmove`, `touchend` describe the individual steps of finger gestures on touch screen devices. However, as users have ten fingers, it is a difficult task to create holistic views from these events. There is a clear need for other holistic SUE implementations such as swipe/drag (holistic one finger gesture) and pinch/spin (holistic two finger gesture). 
 * `compositionstart`, `compositionupdate`, `compositionend` describe the individual steps in text input with dead keys.

## `target.dispatchEvent(...)`

When a component changes state, the component calls `EventTarget.dispatchEvent(event)` to alert the event system of the message. There are several aspects of this method call that need to be considered, and we will do so in this chapter.



    
## References

 *  