# Pattern: UnpreventablesPrevented

In this chapter we will extend the `Event.preventDefault()` method so that it will be able to block actions that in the native event cascades are unpreventable. Examples of such actions is the dispatch of `click` or `auxclick` events from `mouseup`, `keypress` from `keydown`(todo check this one), and `dblclick` from `click`.

We want to be able to do the following:

1. `event.preventDefault()` behaves normally.
2. `event.preventDefault(true)` behaves normally, but in addition this method call will block all subsequent, cascade events. For example, `mouseupEvent.preventDefault(true)` would prevent any `auxclick`, `click`, and/or `dblclick` that would be dispatched as a consequence of this action.
3. `event.preventDefault(eventName)` behaves normally, but in addition this method will also block any cascade event with the given eventName. For example, `mouseupEvent.preventDefault("click")` would block any subsequent `click` cascade event, but *not* `auxclick` nor `dblclick`.
4. `event.preventDefault(listOfEventNames)` behaves normally, but in addition this method will also block any cascade event with a name in the listOfEventNames. For example, `mouseupEvent.preventDefault(["click", "dblclick"])` would block any subsequent `click` and `dblclick` cascade events, but not `auxclick`.

## Extending `.preventDefault()` 

Extending `Event.preventDefault()` to include a list of arguments is pretty straight forward. We need a method that:
1. calls the original `preventDefault()` method, and then
2. contains a registry of unpreventable events,
3. if `preventDefault(argument)` where `argument===true`, then replace argument with the entry of the unpreventable events registry equivalent.   
4. if `preventDefault(argument)` has a string argument, then wrap that argument in an array.
5. if the argument is not an array, it is now illegal.
6. for each event name in the array argument, add an `immediateOnly`, `grab` event listener that both `preventDefault()` and `stopImmediatePropagation()` for that event name.

```javascript
//requires the event listener options: immediatelyOnly and grab 
const EventRoadMap = {
  UNPREVENTABLES: {
    mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
    mouseup: ["click", "auxclick", "dblclick"],
    click: ["dblclick"],
    keydown: ["keypress"]
  }
};

function block(e) {
  e.preventDefault();
  e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
}

const og = Event.prototype.preventDefault;
Object.defineProperty(Event.prototype, "preventDefault", {
  value: function (unpreventables) {
    og.call(this);
    if (unpreventables === undefined || unpreventables === false)
      return;
    if (unpreventables === true)
      unpreventables = EventRoadMap.UNPREVENTABLES[this.type];
    else if (typeof (unpreventables) === 'string' || unpreventables instanceof String)
      unpreventables = [unpreventables];
    if (!(unpreventables instanceof Array))
      throw new Error("Event.preventDefault() must either have an argument that is either void, boolean, string or an array.");
    for (let eventName of unpreventables)
      window.addEventListener(eventName, block, {capture: true, grab: true, immediateOnly: true});
  },
  writable: false
});
``` 

## Demo: 

```html
<script>
  function toggleTick(cb) {
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    return {
      cancel: function () {
        details.ontoggle = undefined;
      },
      resume: function () {
        details.ontoggle = cb;
      }
    };
  }

  /**
   * getEventListeners(name, phase) returns a list of all the event listeners entries
   * matching that event name and that event phase.
   *
   * @param name
   * @param phase either Event.CAPTURING_PHASE, Event.AT_TARGET, or Event.BUBBLING_PHASE.
   *        Defaults to Event.BUBBLING_PHASE.
   * @returns {[{listener, capture}]}
   */
  EventTarget.prototype.getEventListeners = function (name, phase) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return null;
    if (phase === Event.AT_TARGET)
      return this._eventTargetRegistry[name].slice();
    if (phase === Event.CAPTURING_PHASE)
      return this._eventTargetRegistry[name].filter(listener => listener.capture);
    //(phase === Event.BUBBLING_PHASE)
    return this._eventTargetRegistry[name].filter(listener => !listener.capture);
  };

  /**
   * hasEventListeners(name, cb, options) returns a list of all the event listeners entries
   * matching that event name and that event phase. To query for an event listener in BOTH the
   * capture and bubble propagation phases, one must do two queries:
   *
   *    el.hasEventListener(name, cb, false) || el.hasEventListener(name, cb, true)
   *
   * @param name
   * @param cb
   * @param options the only option used in identifying the event listener is capture/useCapture.
   * @returns true if an equivalent event listener is in the list
   */
  EventTarget.prototype.hasEventListener = function (name, cb, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return false;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], cb, capture);
    return index !== -1;
  };

  function findEquivalentListener(registryList, listener, useCapture) {
    return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
  }

  const ogAdd = EventTarget.prototype.addEventListener;
  const ogRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function (name, listener, options) {
    this._eventTargetRegistry || (this._eventTargetRegistry = {});
    this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
    const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
    entry.capture = !!entry.capture;
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
    if (index >= 0)
      return;
    if (entry.immediateOnly) {
      entry.once = false;
      const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
      const macroTask = toggleTick(function () {
        immediateSelf.removeEventListener(name, entry.listener, immediateCapture);
      });
      entry.listener = function (e) {
        macroTask.cancel();
        immediateSelf.removeEventListener(name, entry.listener, immediateCapture);
        immediateCb(e);
      }
    }
    if (entry.once) {
      const onceSelf = this;
      const onceCapture = entry.capture;
      entry.listener = function (e) {
        onceSelf.removeEventListener(name, entry.listener, onceCapture);
        listener(e);
      }
    }
    if (entry.grab) {
      if (this._eventTargetRegistry[name][0].grab)
        throw new Error("The event " + name + " has already been grabbed.");
      entry.first = true;
    }
    if (entry.first) {
      for (let listener of this._eventTargetRegistry[name])
        ogRemove.call(this, name, listener.listener, listener);
      if (!this._eventTargetRegistry[name][0].grab)
        this._eventTargetRegistry[name].unshift(entry);
      else
        this._eventTargetRegistry[name].splice(1, 0, entry); // todo test this
      for (let listener of this._eventTargetRegistry[name])
        ogAdd.call(this, name, listener.listener, listener);
    } else {
      this._eventTargetRegistry[name].push(entry);
      ogAdd.call(this, name, entry.listener, entry);
    }
  };

  EventTarget.prototype.removeEventListener = function (name, listener, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, capture);
    if (index === -1)
      return;
    this._eventTargetRegistry[name].splice(index, 1);
    ogRemove.call(this, name, listener, options);
  };
</script>

<script>
  const EventRoadMap = {
    UNPREVENTABLES: {
      mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
      mouseup: ["click", "auxclick", "dblclick"],
      click: ["dblclick"],
      keydown: ["keypress"]
    }
  };

  function block(e) {
    e.preventDefault();
    e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
  }

  const og = Event.prototype.preventDefault;
  Object.defineProperty(Event.prototype, "preventDefault", {
    value: function (unpreventables) {
      og.call(this);
      if (unpreventables === undefined || unpreventables === false)
        return;
      if (unpreventables === true)
        unpreventables = EventRoadMap.UNPREVENTABLES[this.type];
      else if (typeof (unpreventables) === 'string' || unpreventables instanceof String)
        unpreventables = [unpreventables];
      if (!(unpreventables instanceof Array))
        throw new Error("Event.preventDefault() must either have an argument that is either void, boolean, string or an array.");
      for (let eventName of unpreventables)
        window.addEventListener(eventName, block, {capture: true, grab: true, immediateOnly: true});
    },
    writable: false
  });
</script>

<div id="one">mouseup.preventDefault() behaves normally.</div>
<div id="two">mouseup.preventDefault(true) prevents any `auxclick`, `click`, `dblclick`</div>
<div id="three">mouseup.preventDefault("click") prevents `click`, but not `auxclick` nor `dblclick`.</div>
<div id="four">mouseup.preventDefault(["click", "dblclick"]) prevents `click` and `dblclick`, but not `auxclick`.</div>

<script>
  window.addEventListener("contextmenu", e => e.preventDefault());
  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("auxclick", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  const three = document.querySelector("#three");
  const four = document.querySelector("#four");
  one.addEventListener("mouseup", e => e.preventDefault());
  two.addEventListener("mouseup", e => e.preventDefault(true));
  three.addEventListener("mouseup", e => e.preventDefault("click"));
  four.addEventListener("mouseup", e => e.preventDefault(["click", "dblclick"]));
</script>
```