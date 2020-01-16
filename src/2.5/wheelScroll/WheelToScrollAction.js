export class MyWheelEvent extends Event {
  constructor() {
    super("my-wheel", {bubbles: true, composed: true});
  }

  preventDefault() {
    //todo should cancel the action of scrolling from my-wheel
  }
}

function easeInOutQuint(t) {
  return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
}

export class MyWheelController /*extends CustomCascadeEvent*/ {

  constructor() {
    this.observedTriggers = ["wheel"];
    this.observedPrevented = [];

    this.state = new WeakMap();
    this.activeElements = new Set();
  }

  getObservedNames() {
    return this.observedTriggers.concat(this.observedPrevented);
  }

  doScroll(target) {
    const state = this.state.get(target);
    state.count += 0.1;
    const factor = easeInOutQuint(state.count);
    target.scrollTop = state.startPos + (state.distance * factor);
    if (state.count < 1)
      state.rafId = requestAnimationFrame(this.doScroll.bind(this, target));
    else{
      this.state.delete(target);
      this.activeElements.delete(target);
    }
  }

  wheelTrigger(e, currentTarget) {
    // e.preventDefault();          //CANNOT call preventDefault() on wheel, touchstart, touchmove due to passive: true properties of these events on window.
    // e.stopImmediatePropagation();//The control of the native EventCascade concerning these forms of scrolling must be done outside in the DOM/app.
    //The stopPropation() methods should not be called here neither, since that will block any listeners that will call .preventDefault()...

    //todo raf or queueTask, whichever is first.
    customEvents.queueTask(currentTarget.dispatchEvent.bind(currentTarget, new MyWheelEvent()));

    const startPos = currentTarget.scrollTop;
    const currentClientHeight = currentTarget.clientHeight;
    const scrollDistanceDown = Math.min(currentTarget.scrollHeight - (startPos + currentClientHeight), 100);
    const scrollDistanceUp = -Math.min(startPos, 100);
    const distance = e.deltaY > 0 ? scrollDistanceDown : scrollDistanceUp;

    const isActive = this.state.has(currentTarget);

    this.state.set(currentTarget, {
      startPos,
      distance,
      count: 0
    });
    if (!isActive){
      this.activeElements.add(currentTarget);
      this.doScroll(currentTarget);
    }
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
    for (let activeEl of this.activeElements) {
      const state = this.state.get(activeEl);
      if (!state.rafId)
        throw new Error("omg");
      cancelAnimationFrame(state.rafId);
      this.activeElements.delete(activeEl);
      this.state.delete(activeEl);
    }
  }

  matches(event, el) {
    return el.hasAttribute && el.hasAttribute("my-wheel");
  }
}
