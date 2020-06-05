//<!--developer two, making dinner in November 2020-->
export class TheDinner extends HTMLElement {
  static get version() {
    return "3.4.5";
  }

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = "Eat pizza with <soft-drink></soft-drink>";
    Promise.resolve().then(async ()=>{
      await customElements.define("soft-drink", {name: "SoftDrink", url: "./src/SoftDrink_1_2_5.js"}, {acceptVersion: "1.2"});
      const softDrink = this.shadowRoot.children[0];
      console.log("one", softDrink.one());
      console.log("three", softDrink.three());
    });
  }
}

