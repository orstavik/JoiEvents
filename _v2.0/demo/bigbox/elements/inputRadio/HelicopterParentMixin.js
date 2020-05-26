function findParent(child, parentType) {
  let parent = child.parentNode;
  while (!(parent instanceof parentType))
    parent = parent.parentNode;
  return parent;
}

const childToParents = new WeakMap();

//connectedCallback() is called every time the child is moved, or one of its ancestors is moved.
export function ObserveHelicopterParent(base) {
  return class HelicopterParentChild extends base {
    connectedCallback() {
      super.connectedCallback && super.connectedCallback();
      if (!this.parentChangedCallback)
        return;
      const oldParent = childToParents.get(this);
      //todo I am not happy about when the observedParentType is read. It can change all the time..
      const newParent = findParent(this, this.constructor.observedParentType);
      if (oldParent === newParent)
        return;
      childToParents.set(this, newParent);
      this.parentChangedCallback(oldParent, newParent);
    }
  }
}