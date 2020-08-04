function spoofIsTrusted(e) {
  return new Proxy(e, {
    get(obj, key) {
      if (key === "isTrusted")
        return true;
      const ogPropValue = Reflect.get(obj, key);   //why not obj[key]? don't know
      return ogPropValue instanceof Function ? ogPropValue.bind(obj) : ogPropValue;
    }
  });
}

function printDefaultActions(actions){
  return actions.map(da=> da.index + da.element.tagName +":" +da.task.name + (da.additive ? "+" : "-")).join(" ");
}

function dispatchEventAndReadNativeDefaultActions(event, usecase, res) {
  const dom = usecase();
  const flat = dom.flat(1000);
  const target = flat[0];
  const origin = flat[flat.length - 1];

  origin.addEventListener(event.type, function (e) {
    const spoofE = spoofIsTrusted(e);
    const actions = nativeDefaultActions(spoofE);
    const str = printDefaultActions(actions);
    res.push(str);
  });
  target.dispatchEvent(event);
}

export const mousedownNativeDefaultActions = {
  name: "mousedown native default actions working",
  fun: function (res, usecase) {
    const event = new MouseEvent("mousedown", {button: 0, composed: true, bubbles: true});
    dispatchEventAndReadNativeDefaultActions(event, usecase, res);
  }
};

export const clickNativeDefaultActions = {
  name: "click on form native default actions working",
  fun: function (res, usecase) {
    const event = new MouseEvent("click", {button: 0, composed: true, bubbles: true});
    dispatchEventAndReadNativeDefaultActions(event, usecase, res);
  }
};