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

//todo turn this into a generator? yes, i must try:)
export class EventFrame {
  constructor(event) {
    this.event = event;
    this.bouncedPath = makeBouncedPath(event.composedPath());
    this.doc = 0;
    this.phase = 0;
    this.target = 0;
    this.listener = -1;
  }

  next() {
    this.listener++;
    for (; this.doc < this.bouncedPath.length; this.doc++) {
      const {root, nodes: targets} = this.bouncedPath[this.doc];
      for (; this.phase < 2; this.phase++) {
        for (; this.target < targets.length; this.target++) {
          const elCapBub = this.phase ? this.target : targets.length - this.target;
          const target = targets[elCapBub];
          const listenerEntries = target[listeners];
          for (; this.listener < listenerEntries.length; this.listener++) {
            const listener = listenerEntries[this.listener];
            if (listener.capture ^ this.phase)
              return [root, this.phase? 1 : 3, target, listener];
          }
          this.listener = 0;
        }
        this.target = 0;
      }
      this.phase = 0;
    }
  }
}