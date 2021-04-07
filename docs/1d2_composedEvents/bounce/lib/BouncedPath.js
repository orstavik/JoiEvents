export function convertToBounceSequence(composedPath) {
  return convertToBounceSequenceImpl(composedPath);
}

function convertToBounceSequenceImpl(composedPath, parent) {
  const root = composedPath.pop();
  const context = {parent, root, path: [root]};
  let res = [];
  while (composedPath.length) {
    if (composedPath[composedPath.length - 1] instanceof ShadowRoot) {
      const shadow = convertToBounceSequenceImpl(composedPath, root);
      res = [...shadow, ...res];
    } else {
      const target = composedPath.pop();
      context.path.unshift(target);
      if (target instanceof HTMLSlotElement && composedPath[composedPath.length - 1]?.assignedSlot === target)
        return [context, ...res];
    }
  }
  return [context, ...res];
}

export function bounceSequence(target, root) {
  if (!(target instanceof EventTarget || target instanceof Window))
    throw new Error('IllegalArgumentType: the "target" in bounceSequence(target, ...) must be either an EventTarget or Window.');
  if (root === true)
    root = window;
  else if (root === undefined || root === false)
    root = target.getRootNode();
  else if (!(root instanceof DocumentFragment || root instanceof Window))
    throw new Error('IllegalArgumentType: the "root" in bounceSequence(target, root) must be either true (as in composed: true), false (as in composed: false), or a Document or Window.');
  return bounceSequenceImpl(target, root, undefined);
}

function bounceSequenceImpl(startNode, endDocumentWindow, parent) {
  let contexts = [];
  for (let t = startNode; t; t = t.host) {
    const path = [];
    for (; t; t = t.parentNode)
      path.push(t);
    t = path[path.length - 1];
    t === document && path.push(t = window);
    contexts[0] && (contexts[0].parent = t);
    contexts.unshift({root: t, path, parent});
    if (t === endDocumentWindow)
      break;
  }
  for (let i = contexts.length - 1; i >= 0; i--) {
    const {root, path} = contexts[i];
    for (let j = 0; j < path.length - 1; j++) {
      const mightBeSlotted = path[j];
      const mightBeHost = path[j + 1];
      const slot = mightBeSlotted.assignedSlot;
      const shadow = mightBeHost.shadowRoot;
      if (slot && shadow)
        contexts = [...contexts, ...(bounceSequenceImpl(slot, shadow, root))];
    }
  }
  return contexts;
}

function getDepth(depths, root, parent) {
  const depth = depths.get(root);
  if (depth !== undefined)
    return depth
  const parentDepth = depths.get(parent);
  if (parentDepth === undefined)
    throw new Error('BouncedPathBug 1: A UseD document is listed before its UseR document.');
  const depths2 = Array.from(depths.entries()).reverse();
  for (let [lastRoot, lastDepth] of depths2) {
    if (lastRoot === parent) break;
    if (lastDepth.length <= parentDepth.length)
      throw new Error('BouncedPathBug 2: Maybe sibling document listed before a nested document?');
  }
  return depths.set(root, parentDepth + '  '), depths.get(root);
}

export function print(bouncedPath) {
  const depths = new Map([[undefined, '']]);
  if(!bouncedPath.every(({root, path})=>path.every(el=> root === window ? el === window || el === document || el.getRootNode() === document: el.getRootNode() === root))) throw new Error('BouncedPathBug: root node error.');
  return bouncedPath.map(({parent, root, path}) =>
    getDepth(depths, root, parent) +
    (root.host ? root.host.nodeName : 'window') + ': ' +
    path.map(et => et.nodeName || 'window')
  );
}
