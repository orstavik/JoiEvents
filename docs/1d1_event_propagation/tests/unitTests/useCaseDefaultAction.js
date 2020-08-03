class ClickAuxclick extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.onClick.bind(this), {capture: true, unstoppable: true});
    // this.addEventListener("auxclick", this.onAuxclick.bind(this), {capture: true, unstoppable: true});
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
    event.setDefault(this.requestClick.bind(this), this);  //setDefault
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

class ClickWithDivCheckbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `<div>div</div><input type="checkbox" />`;
  }
}

customElements.define("click-with-div-checkbox", ClickWithDivCheckbox);

class DefaultActionAroundClickWithDivCheckbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `<click-with-div-checkbox></click-with-div-checkbox>`;
    this.addEventListener("click", this.onClick.bind(this), {unstoppable: true, capture: true});
  }

  onClick(e) {
    if (e.button !== 0)
      return;
    e.setDefault(this.requestClickAction.bind(this), this);
  }

  requestClickAction() {
    const daEvent = new Event("default-action", {bubbles: true, composed: true});
    daEvent.trigger = "click";
    this.dispatchEvent(daEvent);
  }
}

customElements.define("default-action-around-click-with-div-checkbox", DefaultActionAroundClickWithDivCheckbox);

//useCaseClickWithDivCheckbox1
// Flattened DOM                                 | DOM context
//--------------------------------------------------------
//  default-action-around-click-with-div-checkbox| A. main
//    #shadowRoot                                | AA. #default-action-around-click-with-div-checkbox-shadowRoot
//      click-with-div-checkbox                  | AA. #default-action-around-click-with-div-checkbox-shadowRoot
//        #shadowRoot                            | AAA. #click-with-div-checkbox-shadowRoot
//          div                                  | AAA. #click-with-div-checkbox-shadowRoot

//<default-action-around-click-with-div-checkbox>
//  #shadowRoot
//    <click-with-div-checkbox>
//      #shadowRoot
//        <div>div</div>
//      /#shadowRoot
//    </click-with-div-checkbox>
//  /#shadowRoot
//</default-action-around-click-with-div-checkbox>

function useCaseClickWithDivCheckbox1() {
  const defaultActionAroundClickWithDivCheckbox = document.createElement("default-action-around-click-with-div-checkbox");
  const shadow1 = defaultActionAroundClickWithDivCheckbox.shadowRoot;
  const clickWithDivCheckbox = shadow1.children[0];
  const shadow2 = clickWithDivCheckbox.shadowRoot.children[0];
  const div = clickWithDivCheckbox.shadowRoot.children[0];
  clickWithDivCheckbox.appendChild(div);

  const usecaseDiv = [
    [
      [
        div,
        shadow2
      ],
      clickWithDivCheckbox,
      shadow1
    ],
    defaultActionAroundClickWithDivCheckbox
  ];
  Object.freeze(usecaseDiv, true);
  return usecaseDiv;
}

//useCaseClickWithDivCheckbox1
// Flattened DOM                                 | DOM context
//--------------------------------------------------------
//  default-action-around-click-with-div-checkbox| A. main
//    #shadowRoot                                | AA. #default-action-around-click-with-div-checkbox-shadowRoot
//      click-with-div-checkbox                  | AA. #default-action-around-click-with-div-checkbox-shadowRoot
//        #shadowRoot                            | AAA. #click-with-div-checkbox-shadowRoot
//          input                                | AAA. #click-with-div-checkbox-shadowRoot

//<default-action-around-click-with-div-checkbox>
//  #shadowRoot
//    <click-with-div-checkbox>
//      #shadowRoot
//        <input type="checkbox" />
//      /#shadowRoot
//    </click-with-div-checkbox>
//  /#shadowRoot
//</default-action-around-click-with-div-checkbox>

function useCaseClickWithDivCheckbox2() {
  const defaultActionAroundClickWithDivCheckbox = document.createElement("default-action-around-click-with-div-checkbox");
  const shadow1 = defaultActionAroundClickWithDivCheckbox.shadowRoot;
  const clickWithDivCheckbox = shadow1.children[0];
  const shadow2 = clickWithDivCheckbox.shadowRoot.children[0];
  const checkbox = clickWithDivCheckbox.shadowRoot.children[1];
  clickWithDivCheckbox.appendChild(checkbox);

  const usecaseDiv = [
    [
      [
        checkbox,
        shadow2
      ],
      clickWithDivCheckbox,
      shadow1
    ],
    defaultActionAroundClickWithDivCheckbox
  ];
  Object.freeze(usecaseDiv, true);
  return usecaseDiv;
}

export const useCasesDefaultActions = {
  useCaseClickAuxclickDiv
};
Object.freeze(useCasesDefaultActions, true);

export const useCasesDefaultActions2 = {
  useCaseClickWithDivCheckbox1,
  useCaseClickWithDivCheckbox2
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
