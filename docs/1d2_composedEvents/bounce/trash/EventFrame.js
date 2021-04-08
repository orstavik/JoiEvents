function getPropagationRoot(el) {
  const root = el.getRootNode && el.getRootNode() || window;//todo should the window be separated as its own document?
  return root === document ? window : root;
}

function makeBouncedPath(composedPath) {
  const docs = [];
  for (let el of composedPath) {
    const root = getPropagationRoot(el);
    const doc = docs.find(({root: oldRoot}) => oldRoot === root);
    doc ?                   //first encounter
      doc.nodes.push(el) :
      el instanceof HTMLSlotElement ?
        docs.push({root, nodes: [el]}) :
        docs.unshift({root, nodes: [el]});
  }
  return docs;
}

function explodePathThreePhases(nodes) {
  return [
    ...nodes.slice(1).reverse().map(node => ({node, phase: 'capture', listeners: node[listeners]})),
    {node: nodes[0], phase: 'target', listeners: nodes[0][listeners]},
    ...nodes.slice(1).map(node => ({node, phase: 'bubble', nodes: node[listeners]}))
  ];
}

function explodePathTwoPhases(nodes) {
  return [
    ...nodes.slice().reverse().map(node => ({node, phase: 'capture', listeners: node[listeners]})),
    ...nodes.slice().map(node => ({node, phase: 'bubble', nodes: node[listeners]}))
  ];
}

export class EventFrame {
  constructor(event) {
    this.event = event;
    this.eventPhase = undefined;                //replace with getters?
    this.currentTarget = undefined;
    this.currentDocument = undefined;
    this.currentListener = undefined;
    // this._currentTargetComposed = undefined;
    // this._eventPhaseComposed = undefined;

    this.composedPath = event.composedPath();
    this._composedPathExploded = explodePathThreePhases(this.composedPath);    //[elPhase# => [*listeners]]
    this._composedIndex = [0, -1];

    this.bouncedPath = makeBouncedPath(this.composedPath);
    this._bouncedPathExploded = this.bouncedPath.map(explodePathTwoPhases);  //[doc# => [elPhase#=> [*listeners]]]
    this._bouncedIndex = [0, 0, -1];

    this._addedListeners = [];
  }

  getCurrentComposedTarget() {
    this._composedPathExploded[this._composedIndex[0]].target;
  }

  getComposedEventPhase() {
    this._composedPathExploded[this._composedIndex[0]].phase;
  }

  static getOrMakeEventFrame(event) {
    if (eventStack[0] === event)
      return eventStack[0];
    const frame = new EventFrame(event);
    eventStack.unshift(frame);
    return frame;
  }

  static nextListener(i, j, explodedPath, skipListeners) {
    for (; i < explodedPath.length; i++, j = 0) {
      const {phase, listeners} = explodedPath[i];
      for (; j < listeners.length; j++) {
        let listener = listeners[j];
        if (listener.removed) continue;
        if (skipListeners.includes(listener)) continue;
        if (phase === 'bubble' && listener.capture) continue;
        if (phase === 'capture' && !listener.capture) continue;
        return [i, j, listener];
      }
    }
    return [i, j, undefined];
  }

  getNextComposedListener(persist) {
    let [i, j] = this._composedIndex;
    const [nextEl, nextLi, listener] = EventFrame.nextListener(i, j + 1, this._composedPathExploded, this._addedListeners);
    if (nextEl > i && persist)
      this._addedListeners = [];
    if (persist)
      this._composedIndex = [nextEl, nextLi];
    return listener;
  }

  getNextBouncedListener() {
    let [doc, i, j] = this._bouncedIndex;
    j += 1;
    let listener;
    for (; doc < this._bouncedPathExploded.length; doc++, i = 0, j = 0) {
      [i, j, listener] = EventFrame.nextListener(i, j, this._bouncedPathExploded[doc]);
      if (listener)
        break;
    }
    this._bouncedIndex = [doc, i, j];
    return listener;
  }

  frameTick( listenerForCheckup) {
    //get the next composed listener, and check it
    const composedListener = this.getNextComposedListener(true);
    //todo here we could just skip the focus on the nextComposedListener. But, if we do that, then we don't know if the frame will run that listener or not.
    if (listenerForCheckup !== composedListener) throw new Error("omg, this shouldn't happn");
    //run the next bounced listener if any
    const bouncedListener = this.getNextBouncedListener();
    const res = bouncedListener.cb.call(bouncedListener.target, this.event);
    return this.completeComposedFrame();
  }

  //returns true when the frame is completed, false if there are more composed listeners
  completeComposedFrame() {
    let trailingBouncedListener;
    while (trailingBouncedListener = !this.getNextComposedListener(false) && this.getNextBouncedListener())
      const res = trailingBouncedListener.cb.call(trailingBouncedListener.target, this.event);
    return trailingBouncedListener === undefined;
  }
}