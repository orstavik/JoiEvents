import {lastPropagationTarget} from "./computePaths.js";

//This method only needs to run if/when preventDefault() is called.
//addDefault(task) doesn't need it.
//and if preventDefault() is called in the uppermost DOM context, then
//the check is not necessary as the defaultAction is done either way.

//todo this mtethod also only needs to sometimes, at the end, when preventDefault() has been called.
//receives a propagtion path array, and then returns an array of the native default actions that matches the given input.
export function nativeDefaultActions(event, propagationPath) {
  //1. split on event type and properties
  //  event: "click.button=0",
  //2. test for propagation path.
//  element: "alpha-alpha > div",
  //3. all native default actions are exclusive
//  exclusive: true,
  //4. return a method that represent the default action whenever possible?
//  method: details.requestToggle, form.requestSubmit, form.requestReset, a.requestNavigation, checkbox.requestToggle
  //todo there are many native default actions that are hard to explicate/make a requestDefaultAction for.
  // The input text and textarea doesn't give us the position of the caret, thus making it hard to add txt.
  //todo there are 
}

let nativePreventDefault;

export function addAddDefaultAction(EventPrototype) {
  nativePreventDefault = EventPrototype.preventDefault;
  Object.defineProperty(EventPrototype, "setDefault", {value: setDefault});
  Object.defineProperty(EventPrototype, "preventDefault", {value: preventDefault});
  Object.defineProperty(EventPrototype, "defaultPrevented", {get: defaultPrevented});
}

/**
 * defaultPrevented gives a snapshot to see if the event has been stopped in this or a higher DOM context.
 */
function defaultPrevented() {
  // todo implement this ...
  // if (!this.defaultPreventeds)
  //   return false;
  // const path = this.composedPath();
  // const highestDefaultprevented = this.defaultPreventeds.lastIndexOf(true);
  // const highestDefaultpreventedContext = findRootInPath(path, highestDefaultprevented);
  //
  // const index = this.eventPhase > 0 ? path.indexOf(this.currentTarget) : path.length;
  // this.preventDefaults[index] = true;
  //
  // // const preventedContexts = Object.keys(this.defaultPreventeds);
  // // if (!preventedContexts.length)
  // //   return false;
  // // const currentContext = this.currentTarget.getRootNode();
  // // for (let prevented of preventedContexts) {
  // //   if (prevented.compareDocumentPosition(currentContext) & Node.DOCUMENT_POSITION_CONTAINS)
  // //     return true;
  // // }
  // // return false;
}

/**
 *   path                  prevents   actions
 *   ---------------------------------------------------
 * window
 *   #document
 *     body
 *       a href                       func
 *         web-comp
 *           #shadow        true
 *             details                func
 *               summary
 */

function processDefaultAction(event) {
  const path = event.composedPath();
  const defaultActions = event.defaultActions;
  const defaultPreventeds = event.preventDefaults;

  const highestDefaultprevented = defaultPreventeds.lastIndexOf(true);
  const highestDefaultpreventedContext = findRootInPath(path, highestDefaultprevented);
  const unpreventedDefaultActions = defaultActions.slice(highestDefaultpreventedContext);
  const unpreventedPath = path.slice(highestDefaultpreventedContext);
  const firstCustomUnprevented = unpreventedDefaultActions.find(func => !!func);
  firstCustomUnprevented();
  //todo find the first unpreventedDefaultAction, or the first native defaultAction of the remainder.

  //
  // const defPreventeds = Object.entries(event.defaultPreventeds);
  // let highestDefaultprevented = defPreventeds.shift();//todo this doesn't work if there are no calls to preventDefault()
  // for (let defPrevented of defPreventeds) {
  //   if (highestDefaultprevented[0].compareDocumentPosition(defPrevented[0]) & Node.DOCUMENT_POSITION_CONTAINS)
  //     highestDefaultprevented = defPrevented;
  // }
  // let lowestDefaultAction;
  // for (let defAction of Object.entries(event.defaultActions)) {
  //   if (highestDefaultprevented.compareDocumentPosition(defAction[0]) & Node.DOCUMENT_POSITION_CONTAINS)
  //     continue;
  //   if (!lowestDefaultAction)
  //     lowestDefaultAction = defAction;
  //   else if (lowestDefaultAction[0].compareDocumentPosition(defAction[0]) & Node.DOCUMENT_POSITION_CONTAINS)
  //     lowestDefaultAction = defAction;
  // }
  // let path = event.composedPath();
  // if (highestDefaultprevented)
  //   path = path.slice(path.indexOf(highestDefaultprevented[0]));
  // if (lowestDefaultAction)
  //   path = path.slice(0, path.indexOf(lowestDefaultAction[0]));
  // const nativeDefaultAction = nativeDefaultActions(event, path);
  // if (nativeDefaultAction && highestDefaultprevented) {
  //   //check if there are any other native default actions below.
  //   //if there are, then we will have a problem as there is no way to selectively turn off the native default action
  //   //on the inner element. Which is most likely run. This will produce buggy behavior.
  // } else if (lowestDefaultAction) {
  //   nativePreventDefault.call(event);
  //   lowestDefaultAction[1](/*event*/);
  // } else if (highestDefaultprevented) {
  //   nativePreventDefault.call(event);
  // } else {
  //
  // }

  // all default actions and preventDefault() calls are summarized on the propagation root.
  // slotted nodes work in parallel, so there is a tree, not a list, of default actions.
  // the default actions cancelled within sibling branches doesn't affect each other.
  // the branches are then processed so that what remains is only a list of functions, sorted bottom up.
  // then, the list is executed bottom up.
  // the native default actions should be processed in this order too, but they are instead run last,
  // because they most often are not possible to patch.
  // are each default action run sync/async.
  // I think I match the behavior of default actions with that of event listeners.
  // so they are run as a set of event listeners. in the mesoTaskList.
}

function findRootInPath(path, element) {
  const indexTarget = path.indexOf(element);
  const remainder = path.slice(indexTarget);
  return remainder.find(node => node instanceof ShadowRoot || node === window) || remainder[remainder.length - 1];
}

// prevent default applies per DOM context.
function preventDefault() {
  //1. Patch event defaultAction processing if it is not there
  this.defaultActions || instantiateDefaultActionOnDemand.call(this);

  //2. Find the root of the currentTarget.
  //   Att!! The elements can dynamically be moved around in the DOM during event propagation.
  //   This means that we must find the root of the currentTarget as it was at the outset of the event.
  //   The Event.composedPath() represents a snapshot of the DOM for the event's path as it was at the outset of the event.
  //2b. If preventDefault() is called before the event has begun propagating, then the root is set to be the topMost document.
  const path = this.composedPath();
  const index = this.eventPhase > 0 ? path.indexOf(this.currentTarget) : path.length;
  this.preventDefaults[index] = true;
  //
  // const index = this.eventPhase > 0 ? path.indexOf(findRootInPath(path, this.currentTarget)) : path.length - 1;
  // if (this.preventDefaults >= index) //already called preventDefault in this context, or a context above.
  //   return;
  //
  // //3. if preventDefault has already been called for this DOM context, no need to do anything
  // if (this.preventDefaults.has(domContext))
  //   return;
  //
  // //4. flag the DOM context as prevented
  // this.preventDefaults.add(domContext);
  //
  // //5. if preventDefault is called on the global scope, then
  // // a. call the native PreventDefault immediately
  // // b. remove any patch for postPropagationCallback for defaultAction
  // if (path.indexOf(domContext) === path.length - 1) {
  //   nativePreventDefault.call(this);
  //   const lastNode = lastPropagationTarget(this);
  //   lastNode.removeEventListener(this.type, processDefaultAction, {unstoppable: true, last: true, once: true});
  // }
}

// add defaultAction applies on a per DOM context scope.
function instantiateDefaultActionOnDemand() {
  //todo weakmaps outside of the event object, so they cannot be manipulated.
  this.defaultActions = new Array(this.composedPath().length);
  this.preventDefaults = new Array(this.composedPath().length + 1);
  //patch the post propagation callback for processing the default action
  const lastNode = lastPropagationTarget(this);
  lastNode.addEventListener(this.type, processDefaultAction, {unstoppable: true, last: true, once: true});
}

// the position of the default action in the array is the position of the currentTarget in the DOM.
// default actions that are set before the event begins propagating, is set as the last priority/at the end of the array.
// the first default action added will be chosen. You cannot override default action for the same element.
function setDefault(defaultAction) {
  this.defaultActions || instantiateDefaultActionOnDemand.call(this);
  const path = this.composedPath();
  //todo this assumes that no closed mode shadowDOMs are available.
  //todo it is possible to override composedPath() to pretend as if the composedPath() is still closed..
  //todo this would be a way to avoid overriding the closed-mode shadowRoots.. Then we could have a "composedPath(fullNative)"
  //todo method instead.. To give us access to the elements in the dispatch event method..
  const index = this.eventPhase > 0 ? path.indexOf(this.currentTarget) : 0;
  this.defaultActions[index] = this.defaultActions[index] || defaultAction;
}