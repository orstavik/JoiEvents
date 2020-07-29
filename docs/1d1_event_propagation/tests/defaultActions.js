import {getContextID, lastPropagationTarget} from "./computePaths.js";
import {lowestExclusiveNativeDefaultActions} from "./nativeDefaultActions.js";

let nativePreventDefault;

export function addAddDefaultAction(EventPrototype) {
  nativePreventDefault = EventPrototype.preventDefault;
  Object.defineProperty(EventPrototype, "setDefault", {value: setDefault});
  Object.defineProperty(EventPrototype, "preventDefault", {value: preventDefault});
  Object.defineProperty(EventPrototype, "defaultPrevented", {get: getDefaultPrevented});
}

/**
 * defaultPrevented gives a snapshot to see if the event has been stopped in this or a higher DOM context.
 * The problem is if you are calling preventDefault inside a slotted DOM context.
 * Should this preventDefault() apply to the flattenedDOM? or should it only apply to the slotted DOM context?
 *
 * The .preventDefault() should be slotted as well, that is it should work on slotted default actions.
 * The reasons for this are:
 * 1. It is no problem to use other means to avoid adding a default action inside the
 * slotted context by simply "not adding" the default action in certain circumstances.
 * 2. If you have a slot-matroschka that you want to disable the default action of the inner slot in the dom context
 * of the outer slot, then you should use a property on the inner slotting element to disable the default action,
 * instead of calling preventDefault().
 * 3. There is no other way than using preventDefault() to have a html element filter out default actions coming into its
 * slotted context. Leaving the preventDefault to function in the flattened DOM context provides a mechanism for those
 * usecases.
 *
 * The problem with using a property, is that it is not a "once" property, but it is sticky, it might stay with the element
 * longer than is intended, and requires the element that needs to "once" disable the default action to queue a function
 * call that will remove the disabled marker again.
 *
 * maybe we need a .preventDefault(scoped) or .preventDefault(slottedOnly).
 *
 * body                                                1. main
 *   my-a[disabled]                                    1. main
 *     #shadowRoot                                     2. my-a
 *       <div>         .preventDefault()               2. my-a
 *         <slot>                         defAct       2. my-a
 *           <checkbox                    defAct       1. main
 *
 *
 * <body                                               1. main
 *   <ivar-a[disabled]                                 1. main
 *     #shadowRoot                                     11. ivar-a
 *       <div>                                         11. ivar-a
 *         <max-a[disabled]                            11. ivar-a
 *           #shadowRoot                               111. max-a
 *             <div>                                   111. max-a
 *               <slot>                  defAct        111. max-a
 *                 <slot>                defAct        11. ivar-a
 *                   <checkbox           defAct        1. main
 *
 *
 * <body                                               1.   body                                 defaultAction
 *   <ivar-a                                           1.   body
 *     #shadowRoot                                     11.  #ivar-a           ..preventDefault
 *       <div>                                         11.  #ivar-a           ..preventDefault
 *         <max-a                                      11.  #ivar-a           .preventDefault
 *           #shadowRoot                               111. #max-a            ...preventDefault
 *             <div>                                   111. #max-a            ...preventDefault
 *               <slot>                  defAct        111. #max-a            ...preventDefault
 *                 <slot>                defAct        11.  #ivar-a           ..preventDefault
 *                   <my-checkbox                      1.   body
 *                     #shadowRoot                     12.  #my-checkbox
 *                       <div             defAct       12.  #my-checkbox
 */

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
  //1. if preventDefault() has been called on one of the two topmost contexts, then we should call the native preventDefault() and simply return
  if (event.preventDefaults.has("") || event.preventDefaults.has("A")) {
    nativePreventDefault.call(event);
    return;
  }
  //x. add the lowest most native exclusive default action to the list.
  let lowestExclusiveNativeDefaultActionTarget = lowestExclusiveNativeDefaultActions(event)?.element;//todo must return [{target, false}, task], where task might nothing
  if (lowestExclusiveNativeDefaultActionTarget) {
    const lowestExclusiveNativeDefaultActionContextID = getContextID(event, lowestExclusiveNativeDefaultActionTarget);
    for (let preventedContextID of event.preventDefaults) {
      if (lowestExclusiveNativeDefaultActionContextID.startsWith(preventedContextID)) {
        nativePreventDefault.call(event);
        lowestExclusiveNativeDefaultActionTarget = undefined;
      }
    }
  }

  //2. filter all the defaultActions based on preventDefault
  //   if the context is prevented below, then i take out all the default actions, exclusive and additive,
  //   from the list of default actions.
  const filteredDefaultActions = Array.from(event.defaultActions).filter(function ([{target, additive}, task]) {
    const targetContext = getContextID(event, target);
    for (let preventedContextID of event.preventDefaults) {
      if (targetContext.startsWith(preventedContextID))
        return false;
    }
    return true;
  });

  //2b. filter out all the exclusive default actions, and add back only the lowest most exclusive default action
  let lowestExclusiveCustomDefaultAction;
  const filteredDefaultActions2 = filteredDefaultActions.filter(function ([{target, additive}, task]) {
    if (additive)
      return true;
    if (!lowestExclusiveCustomDefaultAction)
      lowestExclusiveCustomDefaultAction = [{target, additive}, task];
    else {
      const path = event.composedPath();
      if (path.indexOf(target) < path.indexOf(lowestExclusiveCustomDefaultAction[0].target))
        lowestExclusiveCustomDefaultAction = [{target, additive}, task];
    }
    return false;
  });

  const path = event.composedPath();
  //y. select between the native and custom exclusive default actions
  if (lowestExclusiveNativeDefaultActionTarget && lowestExclusiveCustomDefaultAction) {
    const nativePosition = path.indexOf(lowestExclusiveNativeDefaultActionTarget);
    const customPosition = path.indexOf(lowestExclusiveCustomDefaultAction[0].target);
    if (nativePosition < customPosition)
      lowestExclusiveCustomDefaultAction = undefined;
    else {
      nativePreventDefault.call(event);
      lowestExclusiveNativeDefaultActionTarget = undefined; //is this necessary??
    }
  }

  if (lowestExclusiveCustomDefaultAction)
    filteredDefaultActions2.push(lowestExclusiveCustomDefaultAction);

  //sort the tasks in the list of custom default actions based on the position of their target.
  filteredDefaultActions2.sort((a, b) => {
    const aPos = path.indexOf(a[0].target);
    const bPos = path.indexOf(b[0].target);
    return aPos <= bPos;
  });
  //execute the default action in that order
  const tasksOnly = filteredDefaultActions2.map(([options, task]) => task);
  if (event.async)
    return nextMesoTicks(tasksOnly, 1);
  for (let task of tasksOnly) task();
}

/**
 * if preventDefault() or setDefault() is called upon an element dispatched by the native dispatchEvent function in the
 * browser, both the native sync and async dispatchEvent functions of the browser, then no post-propagation callback
 * that process default actions will run. This means that we need to both set up the registers for a) the custom default
 * actions and b) the contexts from where preventDefault() is called, and c) set up a post-propagation callback for this
 * singular event instance, which we do by adding an unstoppable, once, last event listener on the lastPropagationTarget
 * for this event instance.
 *
 * put simply, if the browser dispatches a native event automatically (from UI action by the user) or programmatically
 * (via methods such as `.click()`, then there is no registers for custom default action nor preventDefault() contexts.
 * We then need to add these registers dynamically, and also add a post-propagation callback for the event, implemented
 * as an unstoppable, once, last event listener on the last event target for this particular event.
 *
 * @param event
 */
function instantiateDefaultActionOnDemand(event) {
  //todo weakmaps outside of the event object, so they cannot be manipulated.
  event.defaultActions = new Map();
  event.preventDefaults = new Set();
  //patch the post propagation callback for processing the default action
  const lastNode = lastPropagationTarget(event);
  Promise.resolve().then(() => event.async = true);  //patch the async property of the native event
  lastNode.addEventListener(event.type, processDefaultAction, {unstoppable: true, last: true, once: true});
}

// the position of the default action in the array is the position of the currentTarget in the DOM.
// default actions that are set before the event begins propagating, is set as the last priority/at the end of the array.
// the first default action added will be chosen. You cannot override default action for the same element.
function setDefault(defaultAction, {target = this.currentTarget, additive = false} = {}) {
  if (!this.cancelable)
    return;
  if (target === null)
    throw new Error("if you call setDefault(task, option) before the event begins propagation, you should add the eventTarget node that will be the future target of the event, as the {target} of the second 'option' argument.");
  // target = target || this.currentTarget;//todo this is good, because this would enable us to call setDefault() before the event is dispatched.
  //additive is whether or not the default action should be added to the sequence of default actions, or be excluded
  //by other lower defaultActions.
  this.defaultActions || instantiateDefaultActionOnDemand(this);
  this.defaultActions.set({target, additive}, defaultAction);
}

/**
 * The default action represents a state change that the inner element wishes to do based on an event occuring from
 * its outside. This state change happens in the shadowDOM context of the element (event though the custom element
 * doesn't need to have a shadowDOM in order to process an event in what would principally be its shadowDOM (yes,
 * "a href", i am looking at you!).
 *
 * The default action is supposed to be controlled by the outside lightDOM. the default action is therefore conceptually
 * passed from the inner shadowDOM context to the outer lightDOM context. This is implemented by associating the call
 * to setDefault() with the host node of the custom element adding it to the event. This has one positive consequences:
 * 1. if a custom element wishes to call preventDefault on a default action from one of its shadowDOM elements, and
 *    then add its own, it can do so by calling preventDefault on (or on an element inside ) its shadowDOM root node,
 *    and then adding the default action to its host node. The call to preventDefault would be on an inner DOM context,
 *    while the setDefaultAction would be on an outer DOM context.
 */

//when we setDefault, then the action changing state in the shadowDOM is supposed to be controlled in the lightDOM.
//the action is set on pause, so that the listeners in the lightDOM can review the state change before it reaches them.
//That is probably why Netscape first wanted the capture going down, so that the lightDOM could simply send a message
//to preventDefault down, when the default actions were made.
//This also means that the preventDefault is


/**
 *
 * @returns {boolean} true if preventDefault() has been called from an event listener on the same or higher
 *                    DOM context, false if preventDefault() has not been called or only called within the same DOM
 *                    context.
 *                    Calling preventDefault() before the event has begun propagating, would essentially function as
 *                    calling preventDefault() from above the topmost DOM context (all strings begin with empty string).
 */
function getDefaultPrevented() {
  if (!this.cancelable || !this.preventDefaults)
    return false;
  const myContext = getContextID(this, this.currentTarget);
  return this.preventDefaults.indexOf(str => myContext.startsWith(str)) !== -1;
}

/**
 * .preventDefault() works within its DOM context, and down.
 * This means that .preventDefault() will not apply to higher DOM contexts, or
 * sibling DOM contexts. Sibling DOM contexts arise when the event is slotted, and
 * the uppermost slotted element also has a shadowDOM in itself.
 *
 * registers which DOM context the event listener from where preventDefault() has been called.
 */
function preventDefault() {
  if (!this.cancelable)
    return;
  //todo we should first check to see if the context is topmost.
  // We do not need to add a dynamic event listener postProp callback when
  // preventDefault is called from either the '' or 'A' contexts.
  //1. Patch event defaultAction processing if it is not there
  this.preventDefaults || instantiateDefaultActionOnDemand(this);
  const contextID = getContextID(this, this.currentTarget);
  this.preventDefaults.add(contextID);
}