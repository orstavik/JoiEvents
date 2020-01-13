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
  }

  getObservedNames(){
    return this.observedTriggers.concat(this.observedPrevented);
  }

  mousedownTrigger(event) {
    if (event.buttons !== 1)               //not a left button press
      return;
    this.timer = setTimeout(function () {
      //todo here i should call grab...
      event.target.dispatchEvent(new LongPress("-activated"));
    }, 500);
    this.observedTriggers = ["long-press-activated"];
    this.observedPrevented = ["mousedown", "mouseup"];
  }

  longPressActivatedTrigger(event) {
    this.observedTriggers = ["mouseup"];
    this.observedPrevented = ["mousedown"];
  }

  mouseupTrigger(event) {
    event.preventDefault();
    this.observedTriggers = ["mousedown"];
    this.observedPrevented = [];
    queueTaskInEventLoop(function(){
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
    throw new Error("omg");
  }

  preventedEvent(event) {
    clearTimeout(this.timer);
    this.state = [];
    this.observedTriggers = ["mousedown"];
    this.observedPrevented = [];
  }

  matches(event, el) {
    return el.hasAttribute("long-press");
  }
}
