export class MyWheelEvent extends Event {
  constructor() {
    super("my-wheel", {bubbles: true, composed: true});
  }
}

export class MyWheelController /*extends CustomCascadeEvent*/ {

  constructor() {
    this.observedTriggers = ["wheel"];
    this.observedPrevented = [];
    this.startTarget = undefined;
    this.remainingScrollActions = [];
    this.currentScrollSpeed = 0;
    this.nextScrollTask;
  }

  getObservedNames() {
    return this.observedTriggers.concat(this.observedPrevented);
  }

  doScroll(counter) {
    if (counter)
      return this.nextScrollTask = requestAnimationFrame(this.doScroll.bind(this, --counter));
    console.log("scroll action");
    const scrollDistance = this.remainingScrollActions.shift();
    this.startTarget.scrollTop += scrollDistance;
    if (this.remainingScrollActions.length){
      this.currentScrollSpeed += 1;
      this.doScroll(this.currentScrollSpeed);
    } else {
      this.cancelCascade();
    }
  }

  wheelTrigger(e, currentTarget) {
    this.startTarget = currentTarget;

    // e.preventDefault();          //CANNOT call preventDefault() on wheel, touchstart, touchmove due to passive: true properties of these events on window.
    // e.stopImmediatePropagation();//The control of the native EventCascade concerning these forms of scrolling must be done outside in the DOM/app.
                                    //The stopPropation() methods should not be called here neither, since that will block any listeners that will call .preventDefault()...

    this.currentScrollSpeed = 0;
    this.remainingScrollActions = [2, 4, 8, 10, 14, 14, 15, 12, 10, 7, 3];

    const target = this.startTarget;
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
    this.startTarget = undefined;
    this.remainingScrollActions = [];
    this.currentScrollSpeed = 0;
    cancelAnimationFrame(this.nextScrollTask);
  }

  matches(event, el) {
    return el.hasAttribute && el.hasAttribute("my-wheel");
  }
}
