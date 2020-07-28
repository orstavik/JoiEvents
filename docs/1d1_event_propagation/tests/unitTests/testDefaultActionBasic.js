export const testDefaultActionBasic = [{
  name: "setDefault 1",
  fun: function (res, usecase) {
    const dom = usecase();
    const root = dom[1];
    const target = dom[0];

    root.addEventListener("click", function(){
      res.push("1" + root.defaultActionState);  //should be "" empty string, then "requestClick"
    });
    // clickAuxclick.addEventListener("auxclick", function(){
    //   res.push("auxclick");
    // });
    target.click(); //sync dispatch
    res.push("2" + root.defaultActionState);  //should be "requestClick"
    target.click(); //sync dispatch
    res.push("3" + root.defaultActionState);  //should be "requestClickrequestClick"

  },
  expect: "12requestClick1requestClick3requestClickrequestClick" //function(usecase) or string
}, {
  name: "default action 1",
  fun: function (res, usecase) {
    res.push(1);
  },
  expect: "1" //function(usecase) or string
}];