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

export const mousedownNativeDefaultActions = [{
  name: "mousedown native default actions working",
  fun: function (res, usecase) {
    const dom = usecase();
    const flat = dom.flat(1000);
    const target = flat[0];

    target.addEventListener("mousedown", function (e) {
      const spoofE = spoofIsTrusted(e);
      const nativeDefaultAction = lowestExclusiveNativeDefaultActions(spoofE);
      res.push(nativeDefaultAction?.element?.tagName);
    });
    target.dispatchEvent(new MouseEvent("mousedown", {button: 0, composed: true, bubbles: true}));
  },
  expect: "SELECT"
}];

export const mousedownNativeDefaultActionsNotWorking = [{
  name: "mousedown native default actions wrong",
  fun: function (res, usecase) {
    const dom = usecase();
    const flat = dom.flat(1000);
    const target = flat[0];

    target.addEventListener("mousedown", function (e) {
      const spoofE = spoofIsTrusted(e);
      const nativeDefaultAction = lowestExclusiveNativeDefaultActions(spoofE);
      res.push(nativeDefaultAction);
    });
    target.dispatchEvent(new MouseEvent("mousedown", {button: 0, composed: true, bubbles: true}));
  },
  expect: ""
}];

export const formNativeDefaultActions = [{
  name: "click on form native default actions working",
  fun: function (res, usecase) {
    const dom = usecase();
    const flat = dom.flat(1000);
    const target = flat[0];

    target.addEventListener("click", function (e) {
      const spoofE = spoofIsTrusted(e);
      const nativeDefaultAction = lowestExclusiveNativeDefaultActions(spoofE);
      res.push(nativeDefaultAction?.element?.tagName);
    });
    target.click();
  },
  expect: "FORM"
}];