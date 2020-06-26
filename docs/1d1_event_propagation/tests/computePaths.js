/*
 * ScopedPaths are a set of nested arrays which contain the eventTarget divided by DOM contexts.
 * If you flatten the ScopedPaths, ie. scopedPaths(el, trueOrFalse).flat(Infinity),
 * then you will get the same output as the composedPath() for that element
 * if a composed: trueOrFalse event were dispatched to it.
 *
 * @returns [[path], [path]]
 *          where each path can consist of elements, or other slotted paths.
 */
export function scopedPaths(target, composed, originShadow) {
  let path = originShadow ? [originShadow] : [];
  while (target) {
    path.push(target);
    target.assignedSlot && path.push(scopedPaths(target.assignedSlot, false));
    target = target.parentNode;
  }
  const last = path[path.length - 1];
  if (composed && last.host)
    return scopedPaths(last.host, composed, path);
  if (last === document)
    path.push(window);
  return path;
}

export function filterComposedTargets(scopedPath) {
  return scopedPath[0] instanceof Array ?
    [...filterComposedTargets(scopedPath[0]), scopedPath[1]] :
    [scopedPath[0]];
}

export function computePropagationPath(scopedPath, bubbles) {
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