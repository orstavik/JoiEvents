function distanceMoreThan4(a, b) {
  const distX = b.clientX - a.clientX, distY = b.clientY - a.clientY;
  return Math.sqrt(distX * distX + distY * distY) > 4;
}

let listeningState;
let targetState;

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
      if (targetState || listeningState)
        throw new Error("omg! drag state was not reset");
      listeningState = event;
      customEvents.define(DragImitation, ["mousemove", "mouseup"]);
    } else {                      //more than one button or not the left button
      if (targetState) {
        event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
        DragImitation.endSequence(event, "drag-imitation-cancel");
      }
      if (listeningState) {
        listeningState = undefined;
        customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      }
    }
  }

  static onMousemove(event) {
    let tasks;
    if (!targetState) {
      if (!distanceMoreThan4(listeningState, event))
        return;
      //listening state => target state
      targetState = listeningState;
      listeningState = undefined;
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      targetState.setMouseCapture(DragImitation.triggerEvent, true);
      customEvents.define(DragImitation, [/*"mousedown", "mousemove", "mouseup", */"blur"]);

      //block mouse event and return new event
      event.preventDefault();
      event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();

      setTimeout(targetState.target.dispatchEvent.bind(targetState.target, new DragImitation("drag-imitation-start", {
        bubbles: true,
        composed: true
      }, targetState)), 0);
    }
    event.preventDefault();
    event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
    setTimeout(targetState.target.dispatchEvent.bind(targetState.target, new DragImitation("drag-imitation", {
      bubbles: true,
      composed: true
    }, event)), 0);
  }

  static onMouseup(event) {
    if (targetState) {
      event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
      DragImitation.endSequence(event, "drag-imitation-end");
    } else {
      listeningState = undefined;
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
    }
  }

  static onBlur(event) {
    if (!targetState)
      throw new Error("omg, forgot to clean up something here");
    if (document.hasFocus())
      return;
    DragImitation.endSequence(event, "drag-imitation-cancel");
  }

  static endSequence(event, name) {
    event.preventDefault();
    setTimeout(targetState.target.dispatchEvent.bind(targetState.target, new DragImitation(name, {
      bubbles: true,
      composed: true
    }, event)), 0);
    targetState = undefined;
    event.releaseMouseCapture();
    customEvents.undefine(DragImitation, ["blur"]);
  }

  static triggerEvent(event) {
    if (event.type === "mousedown")
      DragImitation.onMousedown(event);
    if (event.type === "mousemove")
      DragImitation.onMousemove(event);
    if (event.type === "mouseup")
      DragImitation.onMouseup(event);
    if (event.type === "blur")
      DragImitation.onBlur(event);
  }

  static capturedEvent(eventType) {
    if (targetState)
      throw new Error("wtf, a capture conflict.. Didn't we grab the MouseEvents?");
    if (listeningState) {
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      listeningState = undefined;
    }
  }

  static matches(event, el) {
    return el.hasAttribute && el.hasAttribute("draggable-imitation");
  }
}
