export const testDefaultActionBasic = [{
  name: "setDefault 1",
  fun: function (res, usecase) {
    const dom = usecase();
    const root = dom[dom.length - 1];
    const target = dom[0];

    root.addEventListener("click", function () {
      res.push("1click");  //should be "" empty string, then "requestClick"
    });
    root.addEventListener("default-action", function (e) {
      res.push("2defaultAction" + e.trigger);  //should be "" empty string, then "requestClick"
    });
    // clickAuxclick.addEventListener("auxclick", function(){
    //   res.push("auxclick");
    // });
    target.click(); //sync dispatch
    res.push("x");  //should be "requestClick"
    target.click(); //sync dispatch
    res.push("y");  //should be "requestClickrequestClick"

  }
}];

export const testDefaultActionNative = [{
  name: "setDefault native/non-native",
  fun: function (res, usecase) {
    //clean the hash.
    location.hash = "";
    const dom = usecase();
    const flatDom = dom.flat(1000);
    const root = flatDom[flatDom.length - 1];
    const target = flatDom[0];

    const pushEventType = function (e) {
      res.push(e.type);
    };

    root.addEventListener("click", pushEventType);
    root.addEventListener("default-action", pushEventType);
    root.addEventListener("input", pushEventType);
    target.click(); //sync dispatch
  }
}];