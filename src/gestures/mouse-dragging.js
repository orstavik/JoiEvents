(function () {

  const sequence = Symbol("globalSequence");

  function getFlingStart(end, duration, events) {
    const flingTime = end.timeStamp - duration;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].trigger.timeStamp < flingTime)
        return events[i];
    }
    return events[0];
  }

  //The DraggingEvent class has access to the globalSequence variable via a symbol property.
  //This property should not be tampered with from the outside, and the symbol defense should be strong enough.
  //The DraggingEvent must ONLY read from the sequence property, it should NEVER write to it.
  //
  //As the DraggingEvent holds on to the sequence object, it will have useful data after being reused.
  //However, this also makes the DraggingEvent a potential memory leak if you preserve only a single DraggingEvent
  //object from each sequence. Therefore, be careful not to store many DraggingEvents for long periods.
  //
  //The coordinates of the DraggingEvent can be retrieved like so:
  // draggingEvent.pageX
  // draggingEvent.trigger.clientX
  // draggingEvent.trigger.screenX

  class DraggingEvent extends Event {
    constructor(type, trigger, globals) {
      super("dragging-" + type, {bubbles: true, composed: true, cancelable: true});
      this.trigger = trigger;
      this.pageX = trigger.pageX;
      this.pageY = trigger.pageY;
      this[sequence] = globals;
    }

    fling(duration) {
      const flingStart = getFlingStart(this.trigger, duration, this[sequence].recorded);
      const distX = parseInt(this.pageX) - flingStart.pageX;
      const distY = parseInt(this.pageY) - flingStart.pageY;
      const distDiag = Math.sqrt(distX * distX + distY * distY);
      const durationMs = this.trigger.timeStamp - flingStart.trigger.timeStamp;
      const angle = ((Math.atan2(distY, -distX) * 180 / Math.PI) + 270) % 360;
      return {distX, distY, distDiag, durationMs, angle, flingStart};
    }
  }

  let globalSequence;
  var onMouseupListener = e => onMouseup(e);
  var onMousemoveListener = e => onMousemove(e);
  var onMouseoutListener = e => onMouseout(e);

  function captureEvent(e, stopProp) {
    e.preventDefault();
    stopProp && e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
  }

  function filterOnAttribute(e, attributeName) {                  //[4] FilterByAttribute
    var target = e.composedPath ? e.composedPath()[0] : e.target;
    for (var el = target; el; el = el.parentNode) {
      if (el.hasAttribute && el.hasAttribute(attributeName))
        return el;
    }
  }

  function replaceDefaultAction(target, composedEvent, trigger) {      //[3] ReplaceDefaultAction
    trigger.stopTrailingEvent = function () {
      composedEvent.stopImmediatePropagation ?
        composedEvent.stopImmediatePropagation() :
        composedEvent.stopPropagation();
    };
    trigger.preventDefault();
    return setTimeout(function () {
      target.dispatchEvent(composedEvent)
    }, 0);
  }

  function makeDraggingEvent(name, trigger) {
    return new DraggingEvent(name, trigger, globalSequence);
  }

  function startSequence(target, e) {                                    //[5] Event Sequence
    var body = document.querySelector("body");
    globalSequence = {
      target,                                                                 //[9] GrabTarget
      cancelMouseout: target.hasAttribute("draggable-cancel-mouseout"),        //[6] EventSetting
      recorded: [e],
      userSelectStart: body.style.userSelect                                   //[1]. GrabMouse
    };
    body.style.userSelect = "none";
    window.addEventListener("mousemove", onMousemoveListener, true); //[8] ListenUp
    window.addEventListener("mouseup", onMouseupListener, true);
    window.addEventListener("mouseout", onMouseoutListener, true);
    window.addEventListener("focusin", onFocusin, true);
    !globalSequence.cancelMouseout && window.addEventListener("mouseout", onMouseoutListener, true);
  }

  function updateSequence(e) {                                        //[7] TakeNote
    globalSequence.recorded.push(e);
  }

  function stopSequence() {
    document.querySelector("body").style.userSelect = globalSequence.userSelectStart; //[9]a GrabMouse
    window.removeEventListener("mouseup", onMouseupListener, true);
    window.removeEventListener("mousemove", onMousemoveListener, true);
    window.removeEventListener("mouseout", onMouseoutListener, true);
    window.removeEventListener("focusin", onFocusin, true);
    //the content of the globalSequence could be queued to be emptied here.
    //it must be a double setTimeout as the replaceDefaultAction dispatch of the event is setTimeout shortly after this one.
    //this will force the event to hold on to the data for 2 set timeouts, always. This is bad.
    //don't use this.
    // setTimeout(
    //   function () {
    //     setTimeout(
    //       function () {
    //         globalSequence.recorded = [];
    //       }, 0);
    //   }, 0);
    globalSequence = undefined;
  }

  function onMousedown(trigger) {
    if (globalSequence) {
      var cancelEvent = makeDraggingEvent("cancel", trigger);
      var target = globalSequence.target;
      stopSequence();
      replaceDefaultAction(target, cancelEvent, trigger);
      return;
    }
    if (trigger.button !== 0)
      return;
    var target = filterOnAttribute(trigger, "draggable");
    if (!target)
      return;
    var composedEvent = makeDraggingEvent("start", trigger);
    captureEvent(trigger, false);
    startSequence(target, composedEvent);
    replaceDefaultAction(target, composedEvent, trigger);
  }

  function onMousemove(trigger) {
    if (1 !== (trigger.buttons !== undefined ? trigger.buttons : trigger.which)) {
      var cancelEvent = makeDraggingEvent("cancel", trigger);
      var target = globalSequence.target;                    //[9] GrabTarget
      stopSequence();
      replaceDefaultAction(target, cancelEvent, trigger);
      return;
    }
    var composedEvent = makeDraggingEvent("move", trigger);
    captureEvent(trigger, false);
    updateSequence(composedEvent);
    replaceDefaultAction(globalSequence.target, composedEvent, trigger);
  }

  function onMouseup(trigger) {
    var stopEvent = makeDraggingEvent("stop", trigger);
    captureEvent(trigger, false);
    var target = globalSequence.target;
    stopSequence();
    replaceDefaultAction(target, stopEvent, trigger);
  }

  function onMouseout(trigger) {
    if (trigger.clientY > 0 && trigger.clientX > 0 && trigger.clientX < window.innerWidth && trigger.clientY < window.innerHeight)
      return;
    var cancelEvent = makeDraggingEvent("cancel", trigger);
    var target = globalSequence.target;
    stopSequence();
    replaceDefaultAction(target, cancelEvent, trigger);
  }

  function onFocusin(trigger) {
    var cancelEvent = makeDraggingEvent("cancel", trigger);
    var target = globalSequence.target;
    stopSequence();
    replaceDefaultAction(target, cancelEvent, trigger);
  }

  window.addEventListener("mousedown", onMousedown, true); //[1] EarlyBird
})();

//todo check do we not need MarkMyValues for .x and .y???

//1. `EarlyBird` - the EarlyBird listener function is added before the function is loaded. It calls shotgun.
//3. `ReplaceDefaultAction` - allows us to block the defaultAction of the triggering event. This gives us the clear benefit of a consistent event sequence, but the clear benefit of always loosing the native composed events or the native default action.
//4. `FilterByAttribute` - to make an event specific to certain element instances we need a pure `filterOnAttribute` function that finds the first target with the required attribute, and then dispatching the custom, composed event on that element.         
//5. `EventSequence` - beginning of the sequence of events. Since mouse events start with `mousedown` events, it starts the sequence. Function `startSequence` initializes theproperties that will be used further. These include both the conditions of a `fling` event, and standard css properties, such as
//6. `EventAttribute` - you can set your own conditions for fling events by defining them in custom properties. If you do not define them, the default values will be applied.
//7. `TakeNote` - 
//X. `MarkMyValues` - 
//Y. `CustomEventMethod` - 
//8. `ListenUp` - Adding listeners alternately. Events such as `touchmove`, `touchup` and `touchcancel` will be added only after the `mousedown` event is activated, and will pass through several filtering steps. This allows us to avoid possible mistakes.
//9. `GrabTarget` - target is "captured" in the initial trigger event function (`mousedown`), then stored in the EventSequence's internal state, and then reused as the target in subsequent, secondary composed DOM Events.
//10. `GrabMouse` - the idea is that the initial launch event changes `userSelect` to `none` and after the end of the event sequence, return this value to the state in which it was before the start of the event sequence.