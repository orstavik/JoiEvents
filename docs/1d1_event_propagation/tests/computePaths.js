/*
 * SCOPED_PATHS are a set of nested arrays which contain the eventTarget divided by DOM contexts.
 * If you flatten the SCOPED_PATHS, ie. scopedPaths(el, trueOrFalse).flat(Infinity),
 * then you will get the same output as the composedPath() for that element
 * if a composed: trueOrFalse event were dispatched to it.
 *
 * @returns [[path], [path]]
 *          where each path can consist of elements, or other slotted paths.
 */
export function scopedPaths(target, composed, cutOff) {
  return scopedPathsImpl(target, composed, cutOff, []);
}

function scopedPathsImpl(target, composed, cutOff, path) {
  while (target) {
    path.push(target);
    target.assignedSlot && path.push(scopedPathsImpl(target.assignedSlot, false, undefined, []));
    target = target.parentNode;
  }
  const last = path[path.length - 1];
  if (cutOff === last)
    return path;
  if (composed && last.host)
    return scopedPathsImpl(last.host, composed, cutOff, [path]);
  if (last === document)
    path.push(window);
  return path;
}

export function filterComposedTargets(scopedPath) {
  return scopedPath[0] instanceof Array ?
    [...filterComposedTargets(scopedPath[0]), scopedPath[1]] :
    [scopedPath[0]];
}

export function computePropagationPath(target, composed, bubbles, cutOff) {
  const scopedPath = scopedPaths(target, composed, cutOff);
  //process AT_TARGET nodes, both the normal, innermost AT_TARGET, and any composed, upper, host node AT_TARGETs.
  const composedTargets = filterComposedTargets(scopedPath);
  const lowestTarget = composedTargets.shift();      //the lowestMost target is processed separately

  const raw = scopedPath.flat(Infinity);
  raw.shift();                                       //the lowestMost target is processed separately

  //BUBBLE nodes (or upper, composed AT_TARGET nodes if the event doesn't bubble)
  const bubble = bubbles ?
    raw.map(target => ({
      target: target,
      phase: composedTargets.indexOf(target) >= 0 ? 2 : 3,
      listenerPhase: 3
    })) :
    composedTargets.map(target => ({
      target: target,
      phase: 2,
      listenerPhase: 3
    }));

  //CAPTURE nodes
  const capture = raw.reverse().map(target => ({
    target: target,
    phase: composedTargets.indexOf(target) >= 0 ? 2 : 1,
    listenerPhase: 1
  }));
  return capture.concat([{target: lowestTarget, phase: 2, listenerPhase: 2}]).concat(bubble);
}

export function lastPropagationTarget(event) {
  const composedPath = event.composedPath();
  if (event.bubbles) return composedPath[composedPath.length - 1];
  if (!event.composed) return composedPath[0];
  //non-bubbling and composed
  let last = event.target;
  for (let i = 1; i < composedPath.length - 2; i++) {
    if (composedPath[i] instanceof ShadowRoot)
      last = composedPath[++i];
  }
  return last;
}

/**
 * Add a context ID for each element.
 * The context ID are found using the following algorithm:
 *  1. reverse the composedPath.
 *  2. all context IDs can only be used for one DOM context.
 *  3. start with context ID "A". This marks the main context.
 *  4. every time we pass into a ShadowRoot in the path, a new context ID is selected.
 *     The new context ID is the current context ID with a new character added to its tail.
 *     The IDs represent a trie representation of the context ID graph.
 *  5. Every time the path passes by a slot, the algorithm drops out to the previous context ID
 *     by dropping the last character from the current context ID.
 */
function composedPathContextIDs(path) {
  const res = [];
  let currentID = "A";
  const usedIDs = [currentID];
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i];
    if (node instanceof ShadowRoot) {
      let i = 65;
      let nextName = currentID + String.fromCharCode(i++);
      while (usedIDs.indexOf(nextName) !== -1)
        nextName = currentID + String.fromCharCode(i++);
      currentID = nextName;
      usedIDs.push(currentID);
    }
    res.push(currentID);
    if (node.tagName === "SLOT")
      currentID = currentID.substr(0, -1);
  }
  return res.reverse();
}

/**
 * The contextID represents the position of the root node of an element in a propagation path.
 *
 * Returns empty string "" if the event is queried before propagation.
 * Returns "A" for the top most DOM context.
 * Returns "AA", "AAA", "AB", etc. for the other DOM contexts.
 *
 * If contextID_one.startsWith(contextID_two),
 * then contextID_one contains contextID_two.
 *
 * To get the current contextID during event propagation, call:
 *     getContextID(event, event.currentTarget);
 *
 * ATT!! This method assumes that no "closed"-mode shadowRoots exists in the composed path of the event!
 *       If there were any closed-mode shadowRoots, then a different context id could very well be given for
 *       different elements.
 */
export function getContextID(event, node) {
  if (event.eventPhase === 0)
    return "";
  const path = event.composedPath();
  const contextIDs = composedPathContextIDs(path);
  return contextIDs[path.indexOf(node)];
}

//todo add a function that would open-mode all attachShadow() function calls.