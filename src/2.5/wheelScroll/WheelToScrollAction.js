export class MyWheelEvent extends Event {
  constructor() {
    super("my-wheel", {bubbles: true, composed: true});
  }
}

export class MyWheelController /*extends CustomCascadeEvent*/ {

  constructor() {
    this.observedTriggers = ["WHEEL"];      //capital letters is ACTIVE
    this.observedPrevented = [];
    this.startEvent = undefined;
    this.remainingScrollActions = [];
    this.currentScrollSpeed = 0;
  }

  getObservedNames() {
    return this.observedTriggers.concat(this.observedPrevented);
  }

  doScroll(counter) {
    if (counter)
      return requestAnimationFrame(this.doScroll.bind(this, --counter));
    const scrollDistance = this.remainingScrollActions.shift();
    this.startEvent.target.scrollTop += scrollDistance;
    if (this.remainingScrollActions.length){
      this.currentScrollSpeed += 1;
      this.doScroll(this.currentScrollSpeed);
    } else {
      this.startEvent = undefined;
      this.remainingScrollActions = [];
      this.currentScrollSpeed = 0;
    }
  }

  wheelTrigger(e) {
    this.startEvent = e;

    e.preventDefault();
    // e.stopImmediatePropagation();

    this.currentScrollSpeed = 0;
    this.remainingScrollActions = [2, 4, 8, 10, 14, 14, 15, 12, 10, 7, 3];

    const target = this.startEvent.target;
    customEvents.queueTask(target.dispatchEvent.bind(target, new MyWheelEvent()));
    customEvents.queueTask(this.doScroll.bind(this,this.currentScrollSpeed));
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
    this.startEvent = undefined;
  }

  matches(event, el) {
    return el.hasAttribute && el.hasAttribute("my-wheel");
  }
}
