export class LongPress extends Event {
  constructor(name) {
    super("long-press" + name, {bubbles: true, composed: true});
  }
}

export class LongPressController /*extends CascadeEvent*/ {

  constructor() {
    this.state = [];
    this.observedTriggers = ["mousedown"];
    this.observedPrevented = [];
    this.timer = 0;
    this.isGrabbing;
  }

  getObservedNames() {
    return this.observedTriggers.concat(this.observedPrevented);
  }

  mousedownTrigger(event) {
    if (event.buttons !== 1)               //not a left button press
      return;
    this.timer = setTimeout(function () {
      window.grabEvents(["mousemove", "mouseup"], this);      //todo here i should call grab...
      this.isGrabbing = true;
      event.target.dispatchEvent(new LongPress("-activated"));
    }.bind(this), 500);
    this.observedTriggers = ["long-press-activated"];
    this.observedPrevented = ["mousedown", "mouseup"];
  }

  longPressActivatedTrigger(event) {
    event.preventDefault();
    this.observedTriggers = ["mouseup"];
    this.observedPrevented = ["mousedown"];
  }

  mouseupTrigger(event) {
    event.preventDefault();
    this.cancelCascade();
    queueTaskInEventLoop(function () {
      event.target.dispatchEvent(new LongPress(""));
    });
  }

  triggerEvent(event) {
    if (event.type === "mousedown")
      return this.mousedownTrigger(event);
    if (event.type === "long-press-activated")
      return this.longPressActivatedTrigger(event);
    if (event.type === "mouseup")
      return this.mouseupTrigger(event);
    if (event.type === "mousemove")
      return;
    throw new Error("omg");
  }

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
      window.freeEvents(["mousemove", "mouseup"], this);
    this.state = [];
    this.observedTriggers = ["mousedown"];
    this.observedPrevented = [];
    this.isGrabbing = false;
  }

  matches(event, el) {
    return el.hasAttribute && el.hasAttribute("long-press");
  }
}
