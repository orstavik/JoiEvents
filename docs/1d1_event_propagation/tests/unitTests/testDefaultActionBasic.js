export const testDefaultActionBasic = [{
  name: "setDefault 1",
  fun: function (res, usecase) {
    const dom = usecase();
    const root = dom[dom.length-1];
    const target = dom[0];

    root.addEventListener("click", function(){
      res.push("1click");  //should be "" empty string, then "requestClick"
    });
    root.addEventListener("default-action", function(e){
      res.push("2defaultAction" + e.trigger);  //should be "" empty string, then "requestClick"
    });
    // clickAuxclick.addEventListener("auxclick", function(){
    //   res.push("auxclick");
    // });
    target.click(); //sync dispatch
    res.push("x");  //should be "requestClick"
    target.click(); //sync dispatch
    res.push("y");  //should be "requestClickrequestClick"

  },
  expect: "1click2defaultActionclickx1click2defaultActionclicky" //function(usecase) or string
}, {
  name: "default action 1",
  fun: function (res, usecase) {
    res.push(1);
  },
  expect: "1" //function(usecase) or string
}];