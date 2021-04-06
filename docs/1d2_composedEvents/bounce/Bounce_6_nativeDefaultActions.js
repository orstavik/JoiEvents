//Event.preventDefault version with native defaultAction support

(function () {

  function trustedClick0(el, e, path) {
    if (el.matches("a[href]"))
      return el;
    if (el.matches("form[action]") && target.matches("button[type=submit], input[type=reset]"))
      return el;
    if (el.matches("form") && target.matches("button[type=reset], input[type=reset]"))
      return el;
    if (el.matches("details") && elMinus1.matches("summary") && elMinus1 === el.children[0])//todo
      return el;
  }

  function trustedClick1(el) {
    if (el.matches("a[href]"))
      return el;
    if(el.matches("input[type=text], textarea"))
      return el;
  }

  function trustedMousedown0(el, path) {
    if (el.matches("options") && path.slice(path.indexOf(el)).matches("option"))
      return el;
  }

//todo this is to fire a beforeinput event in most browsers (except old edge and firefox).
//todo some browsers are skipping beforeinput event
//todo the keypress tab also triggers the keypress focus event controller
//todo and the keypress also triggers the text composition system (the implied caret element)
//todo and the DOMActivate event controller

//this function will mostly dispatch the beforeinput event in most browsers.
//in browsers which lacks support for beforeinput, it will directly transform the input/textarea element state.
  function trustedKeydown(el, e, target) {
    //this only dispatches a keypress event
    if (el.matches("textarea"))
      return 1;
    if (el.matches("input[type=text]") && e.key !== "Enter")
      return 1;
    return 0;
  }

  function trustedKeypress(el, e, target) {
    if(!HTMLElement.onbeforeinput)
      return trustedBeforeinput(el, e, target);
    //this only dispatches the beforeinput on the target
    if(el !== target)
      return;
    if (el.matches("textarea"))
      return 1;
    if (el.matches("input[type=text]") && e.key !== "Enter")
      return 1;
    return 0;
  }

  function trustedBeforeinput(el, e, target) {
    if (el.matches("textarea, input, select") && el === target)
      return 1;
    return 0;
  }

  function hasNativeDefaultAction(el, e, path){
    if (!e.isTrusted)
      return;
    if (e instanceof MouseEvent && e.type === "mousedown" && e.button === 0)
      return trustedMousedown0(el, path, e);
    if (e instanceof MouseEvent && e.type === "click" && e.button === 0)
      return trustedClick0(el, e, path);
    if (e instanceof MouseEvent && e.type === "click" && e.button === 1)
      return trustedClick1(el, path, e);
    //1. the keypress enter is transformed into a click by the enterToClick controller in all browsers, i think.
    if (e instanceof KeyboardEvent && e.type === "keydown" && e.key !== "Tab")
      return trustedKeydown(el, e, path);
    if (e instanceof KeyboardEvent && e.type === "keypress" && e.key !== "Tab")
      return trustedKeypress(el, e, path);
    if (e instanceof InputEvent && e.type === "beforeinput")
      return trustedBeforeinput(el, e, path);
  }





  function getPropagationRoot(el, documentBecomesWindow) {                               //todo includeWindow
    const root = el.getRootNode && el.getRootNode() || window;
    return documentBecomesWindow && root === document ? window : root;                   //todo includeWindow
  }

  function makeDocumentEntry(root, el, includeWindow) {
    const parent = root.host ? getPropagationRoot(root.host, includeWindow) : undefined;  //todo includeWindow
    return {root, nodes: [el], parent};
  }

  function makeBouncedPath(composedPath) {
    const docs = [];
    for (let el of composedPath) {
      const includeWindow = composedPath[composedPath.length - 1] === window;     //todo includeWindow
      const root = getPropagationRoot(el, includeWindow);                         //todo includeWindow
      const doc = docs.find(({root: oldRoot}) => oldRoot === root);
      doc ?                   //first encounter
        doc.path.push(el) :
        el instanceof HTMLSlotElement ?
          docs.push(makeDocumentEntry(root, el, includeWindow)) :                 //todo includeWindow
          docs.unshift(makeDocumentEntry(root, el, includeWindow));               //todo includeWindow
    }
    return docs;
  }

  const preventDefaultOG = Event.prototype.preventDefault;
  const stopImmediatePropagationOG = Event.prototype.stopImmediatePropagation;
  Object.defineProperties(Event.prototype, {
    'stopPropagation': {
      value: function () {
        const frame = this.__frame;
        if (frame.listener === -1)
          frame.bouncedPath.forEach(context => context.stopImmediate = true);
        else
          frame.bouncedPath[frame.doc].stop = true;
      }
    },
    'stopImmediatePropagation': {
      value: function () {
        const frame = this.__frame;
        if (frame.listener === -1)
          frame.bouncedPath.forEach(context => context.stopImmediate = true);
        else
          frame.bouncedPath[frame.doc].stopImmediate = true;
      }
    },
    'bubbles': {
      get: function () {
        const frame = this.__frame;
        return frame.bubbles;
      }
    },
    'preventDefault': {
      value: function (rootOrHost) {
        const frame = this.__frame;
        if (arguments.length === 0) {
          frame.bouncedPath[frame.doc].prevented = true;
          return;
        }
        if (frame.listener === -1) {
          frame.bouncedPath[0].prevented = true;
          return;
        }
        if (!frame.event.composedPath().includes(rootOrHost))
          throw new IllegalArgumentError('illegal argument. The argument is not an EventTarget of the current event.', rootOrHost);
        const composedPath = frame.event.composedPath();
        if (rootOrHost === document && composedPath[composedPath.length - 1] === window)
          rootOrHost = window;
        else if (rootOrHost instanceof HTMLElement && rootOrHost.shadowRoot && frame.event.composedPath().includes(rootOrHost.shadowRoot))
          rootOrHost = rootOrHost.shadowRoot;
        if (rootOrHost instanceof Document) {
          frame.bouncedPath.find(({root}) => root === rootOrHost).prevented = true;
          return;
        }
        frame.defaultPreventedHostNodes.push(rootOrHost);
      }
    },
    'defaultPrevented': {
      get: function () {
        const frame = this.__frame;
        if (frame.listener === -1)
          return frame.bouncedPath[0].prevented;

        for (let c = frame.bouncedPath[frame.doc]; c; c = frame.bouncedPath.find(({root}) => root === c.parent))
          if (c.prevented) return true;
        return false;
      }
    },
    'currentTarget': {
      get: function () {
        const frame = this.__frame;
        return frame.listener === -1 ? null : frame.bouncedPath[frame.doc].path[frame.target];
      }
    },
    'eventPhase': {
      get: function () {  //0 not_started/ended, 1 capture, 2 at_target, 3 bubble
        const frame = this.__frame;
        return frame.listener === -1 ? 0 : frame.phase === 0 ? 1 : frame.target === 0 ? 2 : 3;
      }
    },
    'path': {
      get: function () {
        const frame = this.__frame;
        return frame.listener === -1 ? [] : frame.bouncedPath[frame.doc].path.slice();
      }
    },
    'currentDocument': {
      get: function () {
        const frame = this.__frame;
        return frame.listener === -1 ? null : frame.bouncedPath[frame.doc].root;
      }
    },
    'bouncedPath': {
      get: function () { //returns a copy of the bouncedPath (preserving the original bouncedPath immutable).
        const frame = this.__frame;
        return frame.bouncedPath.map(({root, path}) => ({root, path: path.slice()}));
      }
    }
  });

  const dispatchEventOG = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (e, options) {
    if (e.__isSpent)
      throw new Error('Re-dispatch of events is disallowed.');
    if (options instanceof Object && root instanceof EventTarget)
      e.__propagationRoot = root;
    dispatchEventOG.call(this, e);
  }

  function cutPath(fullPath, last) {
    const index = fullPath.indexOf(last);
    return index >= 0 ? fullPath.slice(0, index) : fullPath;
  }

  class EventFrame {
    constructor(event) {
      event.__isSpent = true;
      event.__frame = this;
      this.event = event;
      this.composedPath = cutPath(composedPathOG.call(event), event.__propagationRoot);
      this.bouncedPath = makeBouncedPath(this.composedPath);
      this.doc = 0;
      this.phase = 0;
      this.target = 0;
      this.listener = -1;
      this.bubbles = event.bubbles;
      this.defaultPreventedHostNodes = [];
    }

    next() {
      this.listener++;
      main: for (; this.doc < this.bouncedPath.length; this.doc++, this.phase = this.target = this.listener = 0) {
        const context = this.bouncedPath[this.doc];
        const path = context.path;
        if (context.stopImmediate)
          continue main;
        for (; this.phase < 2; this.phase++, this.target = 0) {
          for (; this.target < path.length; this.target++, this.listener = 0) {
            if (this.phase === 0 && this.target === path.length - 1) continue; //skip at_target during capture
            const elCapBub = this.phase ? this.target : path.length - 1 - this.target;
            const target = path[elCapBub];
            const listenerEntries = target[listeners];
            if (listenerEntries) {
              for (; this.listener < listenerEntries.length; this.listener++) {
                const listener = listenerEntries[this.listener];
                if (listener.type !== this.event.type)
                  continue;
                if ((this.phase === 1 && this.target === 0) || listener.capture ^ this.phase)
                  return listener;
              }
              if (context.stop)
                continue main;
            }
          }
        }
      }
      this.listener = -1;
      //patch for preventDefaultOG.
      const nativeDefaultActionTarget = this.event.composedPath().find(target => hasNativeDefaultAction(target, this.event, this.bouncedPath.find(({path}) => path.includes(target)).path));
      const nativeDefaultActionContext = this.bouncedPath.find(({path}) => path.includes(nativeDefaultActionTarget));
      if(nativeDefaultActionContext.prevented || this.defaultPreventedHostNodes.includes(nativeDefaultActionTarget))
        preventDefaultOG.call(this.event);
    }
  }

  const listeners = Symbol("listeners");
  const removedListeners = [];
  const eventStack = [];

  function eventTick(e) {
    const frame = new EventFrame(e);
    eventStack.unshift(frame);
    stopImmediatePropagationOG.call(e);
    for (let listener; listener = frame.next();) {
      listener.once && removedListeners.push(listener);
      listener.cb.call(listener.target, e);
    }
    if (frame !== eventStack.shift()) throw 'omg';
    eventStack.length === 0 && removedListeners.forEach(removeListenerImpl);
  }

  function getListener(target, type, cb, capture) {
    target[listeners] || (target[listeners] = []);
    return target[listeners].find(old => old.type === type && old.cb === cb && old.capture === capture && !old.removed);
  }

  function defaultPassiveValue(type, target) {
    return (type === 'touchstart' || type === 'touchmove') && (target === window || target === document || target === body);
  }

  function addListenerImpl(l) {
    l.target[listeners].push(l);
    addEventListenerOG.call(l.target, l.type, l.realCb, {capture: l.capture, passive: l.passive});
  }

  function removeListenerImpl(l) {
    l.target[listeners].splice(l.target[listeners].indexOf(l), 1);
    removeEventListenerOG.call(l.target, l.type, l.realCb, {capture: l.capture, passive: l.passive});
  }

  const addEventListenerOG = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, cb, options) {
    const capture = options instanceof Object ? options.capture : !!options;
    if (getListener(this, type, cb, capture))
      return;
    const target = this;
    const passive = options instanceof Object && 'passive' in options ? options.passive : defaultPassiveValue(type, target);
    const once = options instanceof Object && 'once' in options && options.once;
    const listener = {target, type, cb, capture, passive, once};
    listener.realCb = eventTick.bind(listener); //we don't use the listener object, but we need to bind the eventTick to something to get a unique realCb.
    addListenerImpl(listener);
  }

  const removeEventListenerOG = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (type, cb, options) {
    const capture = options instanceof Object ? options.capture : !!options;
    const listener = getListener(this, type, cb, capture);
    listener && (listener.removed = true) && removedListeners.push(listener);
  }
})();