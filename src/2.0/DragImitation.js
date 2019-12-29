function distanceMoreThan4(a, b) {
  const distX = b.clientX - a.clientX;
  const distY = b.clientY - a.clientY;
  return Math.sqrt(distX * distX + distY * distY) > 4;
}

let state;
let captured = false;
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
      if (captured || state)
        throw new Error("omg! drag state was not reset");
      state = [event];
      customEvents.define(DragImitation, ["mousemove", "mouseup"]);
    } else {                      //more than one button or not the left button
      if (captured)
        return DragImitation.endSequence(event, "drag-imitation-cancel");
      if (state) {
        state = undefined;
        customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      }
    }
  }

  static onMousemove(event) {
    if (!captured) {
      state.push(event);
      if (distanceMoreThan4(state[0], state[state.length - 1])) {
        target = state[0].target;
        event.preventDefault();
        event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
        state = undefined;
        customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
        customEvents.setEventTypeCapture(DragImitation, ["mousedown", "mousemove", "mouseup", "blur"]);
        captured = true;
        return [target.dispatchEvent.bind(target, new DragImitation("drag-imitation-start", {
          bubbles: true,
          composed: true
        }, event))];
      }
    } else {
      event.preventDefault();
      event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
      return [target.dispatchEvent.bind(target, new DragImitation("drag-imitation", {
        bubbles: true,
        composed: true
      }, event))];
    }
  }

  static onMouseup(event) {
    if (!captured) {
      state = undefined;
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
    } else {
      event.preventDefault();
      event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.stopPropagation();
      return DragImitation.endSequence(event, "drag-imitation-end");
    }
  }

  static onBlur(event) {
    if (!captured)
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
    captured = false;
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
    if (captured)
      throw new Error("wtf, a capture conflict..");
    if (state){
      customEvents.undefine(DragImitation, ["mousemove", "mouseup"]);
      state = undefined;
    }
  }

  static matches(event, el) {
    return el.hasAttribute && el.hasAttribute("draggable-imitation");
  }
}
