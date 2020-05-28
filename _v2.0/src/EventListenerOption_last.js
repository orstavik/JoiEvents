//target => "eventName"/"eventName capture" => {cb, options}
const targetTypeLast = new WeakMap();

function getLast(target, type, cb, options) {
  const capture = options instanceof Object ? options.capture : !!options;
  const lookupName = capture ? type + " capture" : type;
  return targetTypeLast.get(target)?.get(lookupName);
}

function setLast(target, type, cb, options) {
  const capture = options instanceof Object ? options.capture : !!options;
  const lookupName = capture ? type + " capture" : type;
  let targetsMap = targetTypeLast.get(target);
  if (!targetsMap)
    targetTypeLast.set(target, targetsMap = new Map());
  if (options.once) {
    const og = cb;
    cb = function (e) {
      targetsMap.delete(lookupName);
      og.call(this, e);
    };
  }
  targetsMap.set(lookupName, {cb, options});
  return cb;
}

export function addLastEventListenerOption(proto) {
  const ogAdd = proto.addEventListener;
  const ogRemove = proto.removeEventListener;
  Object.defineProperties(proto, {
    addEventListener: {
      value: function (type, cb, options) {
        const oldLast = getLast(this, type, cb, options);
        if (options?.last && oldLast)
          throw new Error("only one last event listener can be added to a target for an event type at a time.");
        if (options?.last) {
          cb = setLast(this, type, cb, options);
          return ogAdd.call(this, type, cb, options);
        }
        if (oldLast) {
          this.removeEventListener(type, oldLast.cb, oldLast.options);
          const res = ogAdd.call(this, type, cb, options);
          ogAdd.call(this, type, oldLast.cb, oldLast.options);
          return res;
        }
        return ogAdd.call(this, type, cb, options);
      }
    },
    removeEventListener: {
      value: function (type, cb, options) {
        cb = getLast(this, type, cb, options)?.cb || cb;
        ogRemove.call(this, type, cb, options);
      }
    }
  });
}