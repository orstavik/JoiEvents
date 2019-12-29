function distanceMoreThan4(a, b) {
  const distX = b.clientX - a.clientX, distY = b.clientY - a.clientY;
  return Math.sqrt(distX * distX + distY * distY) > 4;
}

let listeningState;
let target;

export class DragImitation extends Event {

  constructor(name = "drag-imitation", props = {bubbles: true, composed: true}, mouseevent) {
    super(name, props);
    this.mouseevent = mouseevent;
  }

  static get observedEvents() {
    return ["mousedown"];
  }

  static onMousedown(event) {
    if (event.buttons === 1) {    //left mouse button
      if (target || listeningState)
        throw new Error("omg! drag state was not reset");
      listeningState = [event];
      customEvents.define(DragImitation, ["mousemove", "mouseup"]);
    } else {                      //more than one button or not the left button
      if (target)
        return DragImitation.endSequence(event, "drag-imitation-cancel");
      if (listeningState) {
        listeningState = undefined;
        customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      }
    }
  }

  static onMousemove(event) {
    let tasks;
    if (!target) {
      listeningState.push(event);
      if (!distanceMoreThan4(listeningState[0], listeningState[listeningState.length - 1]))
        return;
      //cache the mousedownEvent
      const mousedownEvent = listeningState[0];
      //exit listening state
      listeningState = undefined;
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      //enter target state
      target = mousedownEvent.target;
      customEvents.setEventTypeCapture(DragImitation, ["mousedown", "mousemove", "mouseup", "blur"]);
      //block mouse event and return new event
      event.preventDefault();
      event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();

      tasks = [target.dispatchEvent.bind(target, new DragImitation("drag-imitation-start", {
        bubbles: true,
        composed: true
      }, mousedownEvent))];
    }
    tasks = tasks || [];
    event.preventDefault();
    event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
    tasks.push(target.dispatchEvent.bind(target, new DragImitation("drag-imitation", {
      bubbles: true,
      composed: true
    }, event)));
    return tasks;
  }

  static onMouseup(event) {
    if (target) {
      event.preventDefault();
      event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
      return DragImitation.endSequence(event, "drag-imitation-end");
    } else {
      listeningState = undefined;
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
    }
  }

  static onBlur(event) {
    if (!target)
      throw new Error("omg, forgot to clean up something here");
    if (document.hasFocus())
      return;
    event.preventDefault();
    return DragImitation.endSequence(event, "drag-imitation-cancel");
  }

  static endSequence(event, name) {
    const tasks = [target.dispatchEvent.bind(target, new DragImitation(name, {bubbles: true, composed: true}, event))];
    target = undefined;
    customEvents.releaseEventTypeCapture(["mousedown", "mousemove", "mouseup", "blur"]);
    return tasks;
  }

  static triggerEvent(event) {
    if (event.type === "mousedown")
      return DragImitation.onMousedown(event);
    if (event.type === "mousemove")
      return DragImitation.onMousemove(event);
    if (event.type === "mouseup")
      return DragImitation.onMouseup(event);
    if (event.type === "blur")
      return DragImitation.onBlur(event);
  }

  static capturedEvent(eventType) {
    if (target)
      throw new Error("wtf, a capture conflict..");
    if (listeningState) {
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      listeningState = undefined;
    }
  }

  static matches(event, el) {
    return el.hasAttribute && el.hasAttribute("draggable-imitation");
  }
}
