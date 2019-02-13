(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;

  function onMousedown(e) {                                 //[1]
    if (e.button !== 0)                                     //[3]
      return;
    primaryEvent = e;                                       //[4]
    window.addEventListener("mouseup", onMouseup);          //[4]
  }

  function onMouseup(e) {                                   //[5]
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
    if (duration > 300){                                    //[6]
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;                               //[7]
    window.removeEventListener("mouseup", onMouseup);       //[8]
  }

  window.addEventListener("mousedown", onMousedown, true);  //[2]
})();
//1. The event trigger function for the primary event is set up.
//2. The event trigger function for the primary event is registered. This subscription runs always.
//   Every time there is a `mousedown`, there will be a cost for processing the long-press event.
//3. The initial event trigger function filters out `mousedown` events that are not left-clicks.
//4. In normal circumstances, the primary event trigger function (`onMousedown(e)`) will store the
//   trigger event and then add the trigger event functions for the secondary trigger events.
//5. The secondary trigger event function is set up.
//6. When the final trigger event function (`onMouseup(e)`) is triggered, it will check
//   that the press lasted more than 300ms before it dispatches the composed event.
//7. When the EventSequence finishes, it resets its TakeNotes.
//8. When the EventSequence finishes, it removes all secondary trigger function listeners.
//   Resetting the state means both clearing TakeNotes and removing ListenUp secondary event listeners.