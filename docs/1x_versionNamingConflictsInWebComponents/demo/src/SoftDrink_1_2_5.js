//from developer three in October 2020, having just visited the dentist and been given too much praise.
//ps. relax, the sinister dentist knows exactly what he is doing;)
//import {SoftDrink} from "jsdelivr.com/npm/developer3/soft-drink.js";
export class SoftDrink extends HTMLElement {
  static get version() {
    return "1.2.5";
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "CocaCola";
  }

  one() {
    return "one";
  }

  three() {
    return "three";
  }
}