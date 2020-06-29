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
  if(cutOff === last)
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

export function computePropagationPath(target, composed, bubbles) {
  const scopedPath = scopedPaths(target, composed);
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