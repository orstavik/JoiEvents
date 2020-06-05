// from developer three in Mai 2020, looking forward to swimsuit season
//import {SoftDrink} from "jsdelivr.com/npm/developer3/soft-drink.js";
export class SoftDrink extends HTMLElement {

  static get version() {
    return "1.1.5";
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "PepsiMax";
  }

  one() {
    return "one";
  }

  two() {
    return "two";
  }
}