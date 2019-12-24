let mousedown;

export class CancellableClick extends Event {

  constructor(name = "cancellable-click", props = {bubbles: true, composed: true}) {
    super(name, props);
  }

  static get observedEvents() {
    return ["mousedown", "mouseup", "blur"]; //we need to watch blur to see if something breaks the click
  }

  static triggerEvent(event) {
    if (event.type === "mousedown")
      CancellableClick.onMousedown(event);
    else if (event.type === "blur")
      CancellableClick.onBlur(event);
    else if (event.type === "mouseup")
      CancellableClick.onMouseup(event);
    else
      throw new Error("omg");
  }

  static onMousedown(event) {
    mousedown = event;
  }

  static onBlur(event) {
    mousedown = undefined;
  }

  static onMouseup(event) {
    if (mousedown === undefined)  //there will be no click
      return;
    if (event.defaultPrevented)   //todo add stopTheUnstoppable
      ;
  }

  static matches(event, el, weakSetOfElementsForThisEventType) {
    return el.hasAttribute("clickable") || weakSetOfElementsForThisEventType.has(el);
  }
}
