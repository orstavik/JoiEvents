# Pattern: InvadeAndRetreat

InvadeAndRetreat! is a strategy to resolve conflict. It consists of the following steps:

1. Find the **conflict trigger**. Find out *exactly* where and when the conflict first occurs.
2. Clarify the **conflict border**. Find all instances of a) what you might need and b) 
what the other parties might do that might conflict with your needs.
3. **Listen** for the conflict trigger, like a spider in a web.
4. **Invade**. WHAM! Once the trigger is set off, you strike fast and hard! 
And you Invade *at once* and *fully* on two fronts:
   1. **grab** all the access to only the properties that you need, and
   2. **block** all the access to these properties for the other parties.
   3. **do not block** trigger events, as they might be used by other gestures.
5. **Do your thing**. With the access, complete your order of business.
Try to avoid to rape, pillage and loot.
6. **Retreat**. Immediately after you have done what you need, you do a full Retreat.
   1. Unleash all the accesspoints you grabbed during the invasion. 
   2. Unblock all the other parties access points. 
   3. Go back to listening position. And try to act as normal as you can.

Be warned! To put out only a small listener, and then once something touches it 
completely explode, grab everything, and block everything, for then ten seconds later, 
once *you* are content, go back to behaving completely normal, is not a good pattern in life. 
Firstly, people might think you have PTSD or an antisocial personality disorder. 
And try to get you committed or jailed.
Secondly, it is likely going to put the other people around on edge. Especially children.
And that's bad. So don't use this pattern to guide your social life.

In web design on the other hand, this pattern is great! 
Here is why.

## Example: How to avoid that your drag event becomes a drag on scroll performance?

In this example I will set up a web component that uses the InvadeAndRetreat pattern to dispatch 
`dragging` events.

Todo this example is old and wrong. Needs to be updated from Mixin structure to Composed Event, and
it needs to be updated to the last TapDance move.
```javascript
class DragElement extends HTMLElement {
                                  
  constructor() {
    super();
    this._startListener = e => this._start(e);                  //[cache for listen]
    this._moveListener = e => this._move(e);                    //[cache for retreat]
    this._endListener = e => this._end(e);                      //[cache for retreat]
    this._cachedTouchAction = undefined;
    this._cachedUserSelect = undefined;
    this._cachedBody = undefined;                                                 
  }
  
  connectedCallback() {
    this.addEventListener("pointerdown", this._startListener);  //[listen add]
    this.style.userSelect = "none";                             //[block]
    this.style.touchAction = "none";                            //[block]
  }
  
  disconnectedCallback() {
    this.removeEventListener("pointerdown", this._startListener);//[listen remove]
  }
  
  _start(e) {
    //e.preventDefault();                                       //[invade: do not block triggers]
    this.setPointerCapture(e.pointerId);                        //[invade: block] use if pointerevents
    window.addEventListener("pointermove", this._moveListener); //[invade: grab on window]
    window.addEventListener("pointerup", this._endListener);    //[invade: grab on window]
    window.addEventListener("pointercancel", this._endListener);//[invade: grab on window]
    const body = document.querySelector("body");      
    this._cachedTouchAction = body.style.touchAction;           //[cache for retreat]
    this._cachedUserSelect  = body.style.userSelect;            //[cache for retreat]
    body.style.touchAction = "none";                            //[invade: block on body]
    body.style.userSelect = "none";                             //[invade: block on body]
  }
  
  _move(e) {
    e.preventDefault();                                         //[invade: block]
    const detail = {
      x: e.x,
      y: e.y,
    };                                                          //[do your thing]
    this.dispatchEvent(new CustomEvent("dragging", {bubbles: true, composed: true, detail}));
  }
  
  _end(e) {
    //e.preventDefault();                                           //[invade: do not block triggers]
    //this.releasePointerCapture(e.pointerId);                      //[retreat] use if pointerevents
    window.removeEventListener("pointermove", this._moveListener);  //[retreat]
    window.removeEventListener("pointerup", this._endListener);     //[retreat]
    window.removeEventListener("pointercancel", this._endListener); //[retreat]
    const body = document.querySelector("body");      
    body.style.touchAction = this._cachedTouchAction;               //[retreat]
    body.style.userSelect = this._cachedUserSelect;                 //[retreat]
    this._cachedTouchAction =  "none";
    this._cachedUserSelect  = "none";
  }
}
```
1. **Conflict trigger**: It is *only* when this element `pointerdown` is dispatched 
on this element that a conflict might occur.
2. **Conflict border**. When the conflict is triggered, this element needs to:
   * listen for the `pointermove`, `pointercancel` and `pointerup` events.
   * make sure no other native drag-based gestures are activated, anywhere.
3. **Listen**. This element only needs to listen for the pointerdown event when 
it is connected to the DOM.
4. **Invade**. When the `pointerdown` function is triggered:
   * **grab** absolutely all `pointermove` and `pointerup` events. 
   This is done by attaching the event listeners on the window object, and
   calling `this.setPointerCapture(e.pointerId);`
   * **block** all the access to `pointermove` events for native gestures.
   This is done by both adding two restrictive CSS properties 
   `touch-action: none` and `user-selct: none` on the body.
   //todo can i set these CSS properties directly on document element?
   * **do not block** `pointerdown` and `pointerup` as they might
   be used to initialize other gestures.
5. **Do your thing**. Process the `pointermove` event and dispatch a custom `drag` event.
6. **Retreat**. When your `drag` gesture ends with the `pointerup` event, immediately:
   1. release PointerCapture, 
   2. remove event listeners for `pointermove`, `pointercancel`, and `pointerup`, and 
   3. restore the original CSS properties for `touch-action` and `user-select`.

What are the benefits of this approach?
* **Minimum interference when inactive**. 
You only add a single listener for `pointerdown` on the element.
It is only when this trigger is hit, that you add the other listeners. 
To not have `pointermove` event listeners registered when they are not needed is a big plus. 
Even more, the `pointerdown` listener is *removed* when the element is *not connected* to the DOM.

* **Maximum control of the `pointermove` event**. 
Since the `pointermove` events are only active when they will actually be used,
it is no longer problematic to add them to the window element! This removes all 
the headache of managing container elements (todo ref. zingtouch) in order to ensure that 
drag movements that go outside of the element are still caugt. 
This essentially resembles the setPointerCapture functionality of `pointerevents`.

As this example shows, this pattern leaves a fairly big code footprint in a web component.
But, this pattern easily combines with EventComposition and IsolatedFunctionalMixin.
To create excellent GestureMixins, such as the ones in 
[Chapter 5 Gesture mixins](../old_mixins/Mixin1_DraggingFlingGesture.md).

The pattern InvadeAndRetreat handles [conflicting gestures](Discussion_conflicting_gestures.md).

### Caveat
This example only describes how to InvadeAndRetreat. It does not tackle the problem of stuttering gestures 
nor conflict with other gestures that captures uses more fingers on the same element.
This is not yet fully described.
