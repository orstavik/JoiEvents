export class LongPress2 extends Event {
  constructor(name) {
    super("long-press-2" + name, {bubbles: true, composed: true});
  }
}

export class LongPress2Controller /*extends CustomCascadeEvent*/ {

  constructor() {
    this.observedTriggers = ["mousedown"];          //both as trigger and as a cancel trigger
    this.observedPrevented = [];                    //only called as cancel
    this.timer = 0;
    this.isGrabbing;
    this.startEvent;
  }

  getObservedNames(){
    return this.observedTriggers.concat(this.observedPrevented);
  }

  matches(event, el) {
    return el.hasAttribute && el.hasAttribute("long-press-2");
  }

  mousedownTrigger(event) {
    if (event.buttons !== 1)               //not a left button press
      return;
    this.startEvent = event;
    this.timer = setTimeout(this.on500ms.bind(this), 500);
    this.observedTriggers = [];
    this.observedPrevented = ["mousedown", "mouseup"];
  }

  on500ms(){
    customEvents.grabEvents(["mousemove", "mouseup", "mousemove"], this);      //todo here i should call grab...
    this.isGrabbing = true;
    this.startEvent.target.dispatchEvent(new LongPress2("-activated"));
    this.observedTriggers = ["mouseup"];
    this.observedPrevented = ["mousedown"];
  }

  mouseupTrigger(event) {
    event.preventDefault();
    this.cancelCascade();
    customEvents.queueTask(function(){
      event.target.dispatchEvent(new LongPress2(""));
    });
  }

  mousemoveTrigger(e){
    console.log("boo");
    e.stopImmediatePropagation();
    e.preventDefault();
  }

  // triggerEvent(event) {
  //   if (event.type === "mousedown")
  //     return this.mousedownTrigger(event);
  //   if (event.type === "mouseup")
  //     return this.mouseupTrigger(event);
  //   if (event.type === "mousemove")
  //     return;
  //   throw new Error("omg");
  // }

  /**
   * The cancelCascade callback is a method that should reset an EventCascade function.
   * In principle, the cancelCascade is called when another EventCascade function takes
   * control of an EventCascade that this EventCascade function has either started listening
   * to, or would be listening to.
   *
   * In practice, cancelCascade(event) is triggered in 3 situations:
   * 1. when an observedPrevented event occurs.
   * 2. when another EventCascade calls preventDefault() on an observedTriggerEvent.
   * 3. when another EventCascade grabs an an observedPrevented event OR observedTriggerEvent.
   *
   * @param eventOrEventType either the event itself, in case of 1 or 2, or just a string with the eventType in case of 3.
   */
  cancelCascade(eventOrEventType) {
    clearTimeout(this.timer);
    if (this.isGrabbing)
      customEvents.freeEvents(["mousemove", "mouseup", "mousemove"], this);
    this.observedTriggers = ["mousedown"];
    this.observedPrevented = [];
    this.isGrabbing = false;
    this.startEvent = undefined;
  }

}
