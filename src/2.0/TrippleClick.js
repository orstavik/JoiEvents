function lowestIdenticalPathElement(path0, path1, path2) {
  path0 = path0.reverse();
  path1 = path1.reverse();
  path2 = path2.reverse();
  for (let i = 0; i < Math.min(path0.length, path1.length, path2.length); i++) {
    let n = i + 1;
    if (path0[n] === undefined || path0[n] !== path1[n] || path1[n] !== path2[n])
      return path0[i];
  }
}

let state = [];

export class TrippleClick extends Event {

  constructor(name = "tripple-click", props = {bubbles: true, composed: true}) {
    super(name, props);
  }

  static get observedEvents() {
    return ["click"];
  }

  static triggerEvent(event) {
    state.push({event, path: event.composedPath()});
    if (state.length < 3)
      return;
    const duration = state[2].event.timeStamp - state[0].event.timeStamp;
    if (duration > 6000) {
      state.shift();
      return;
    }
    const target = lowestIdenticalPathElement(state[0].path, state[1].path, state[2].path);
    //todo here I could recheck the matches to see if any ancestor element.hasEventListener("tripple-click");
    //todo if it doesn't, why both with dispatching the event?
    //todo but it is likely that the browser does this check natively.
    state = [];
    return [target.dispatchEvent.bind(target, new TrippleClick())];
  }

  static capturedEvent(eventType){
    if (eventType === "click")
      state = [];
  }

  static matches(event, el) {
    if (event.type === "click")
      return true;
    throw new Error("omg!");
  }
}
