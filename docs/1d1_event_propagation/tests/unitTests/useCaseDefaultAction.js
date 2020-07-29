class ClickAuxclick extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.onClick.bind(this), {capture: true, unstoppable: true});
    // this.addEventListener("auxclick", this.onAuxclick.bind(this), {capture: true, unstoppable: true});
    this.defaultActionState = "";
  }

  requestClick() {
    const event = new Event("default-action", {bubbles: true, composed: true});
    event.trigger = "click";
    this.dispatchEvent(event);
  }

  // requestAuxclick() {
  //   res.push("requestAuxclick");
  // }
  //
  onClick(event) {                        //filter event type
    if (event.button !== 0)               //filter event properties
      return;
    const path = event.composedPath();    //filter event path
    const index = path.indexOf(this);     //filter event path
    if (!path[index - 1].matches("div"))  //filter event path
      return;
    event.setDefault(this.requestClick.bind(this));  //setDefault
    //todo here we add the default action to the host node, and so we don't need to add a target option
  }

  // onAuxclick(event) {
  //   if (event.button !== 1)
  //     return;
  //   const path = event.composedPath();
  //   const index = path.indexOf(this);
  //   if (path[index - 1].matches("div"))
  //     event.setDefault(this.requestAuxclick.bind(this), false);
  // }
}

customElements.define("click-auxclick", ClickAuxclick);

//useCaseClickAuxclickDiv
// Flattened DOM                   | DOM context
//----------------------------------------------------------------
//  click-auxclick                 | 1. main
//    div                          | 1. main

//<click-auxclick>
//  <div></div>
//</click-auxclick>

function useCaseClickAuxclickDiv() {
  const clickAuxclick = document.createElement("click-auxclick");
  const div = document.createElement("div");
  clickAuxclick.appendChild(div);

  const usecase = [
    div,
    clickAuxclick
  ];
  Object.freeze(usecase, true);
  return usecase;
}

export const useCasesDefaultActions = {
  useCaseClickAuxclickDiv
};
Object.freeze(useCasesDefaultActions, true);


// const usecase2 = [
//   [
//     {el: shadowH1, context: shadowRoot, contextPos: "12"},
//     {el: shadowRoot, context: shadowRoot, contextPos: "12"},
//   ],
//   {el: shadowComp, context: div, contextPos: "1"},
//   [
//     {el: slotSlot, context: slotRoot, contextPos: "11"},
//     {el: slotSpan, context: slotRoot, contextPos: "11"},
//     {el: slotRoot, context: slotRoot, contextPos: "11"},
//   ],
//   {el: slotComp, context: div, contextPos: "1"},
//   {el: div, context: div, contextPos: "1"},
// ];
// Object.freeze(usecase2, true);
// usecase2.flat(Math.Infinity).map(obj=>obj.el);
