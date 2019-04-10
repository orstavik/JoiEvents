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

## InvadeAndRetreat mouse and touch

This pattern is great for handling conflicts for mouse- and touch-based gestures. 

1. **Conflict trigger**: `mousedown` and `touchstart` are the common conflict triggers.
2. **Conflict border**. When the conflict is triggered, this element needs to:
   * listen for `mousemove`, `touchcancel`, `pointerup`, etc. events.
   * make sure no other native drag-based gestures are activated, anywhere.
3. **Listen** for the conflict trigger. 
4. **Invade**. When the `mousedown` function is triggered:
   * **grab** absolutely all other mouse events by attaching the event listeners on the 
   `window` object, call functions such as `target.setPointerCapture(ev.pointerId);`
   * **block** all the access to mouse and touch move events by both adding two 
   restrictive CSS properties `touch-action: none` and `user-selct: none` on the root HTML element.
   * **do not block** `mousedown` and `pointerup` as they might
   be used to initialize other gestures too.
5. **Do your thing**. Process the `pointermove` event and dispatch a custom `drag` event.
6. **Retreat**. When your gesture ends with the `pointerup` event, immediately:
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

## References

 * 
