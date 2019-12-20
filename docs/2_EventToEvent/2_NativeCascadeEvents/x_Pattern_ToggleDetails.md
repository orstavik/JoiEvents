# DefaultAction: ToggleDetails

blalba

Be aware the toggle event does not bubble, but can still be captured on parent elements in the capture phase.

## Pattern: `.preventDefault()` cancels subsequent state-change and CascadeEvents

the blablabla

    click => "state change" => toggle
    
calling `click.preventDefault()` will cancel the subsequent state change and toggle event. Nice!
  
## Demo: ToggleDetails

```html 
<div>
  <details>
    <summary>Hello</summary>
    Sunshine!!
  </details>
</div>
<script>

  const div = document.querySelector("div");
  const details = document.querySelector("details");
  const summary = document.querySelector("summary");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase, "details is " + (details.open ? "open" : "closed"));
  }

  function preventD(e) {
    console.log("calling: " + e.type + ".preventDefault()");
    e.preventDefault();
  }

  div.addEventListener("click", log, true);
  details.addEventListener("click", log, true);
  summary.addEventListener("click", log);
  details.addEventListener("click", log);
  div.addEventListener("click", log);
  // div.addEventListener("click", preventD);

  div.addEventListener("toggle", log, true);
  details.addEventListener("toggle", log, true);
  summary.addEventListener("toggle", log);    //doesn't work, because the toggle is dispatched on the details as target
</script>
```

## How do we implement such a pattern in a web component?

blbalblablab

## Demo: ToggleDetailsImpl

```html 
<script>
  class MyDetails extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<slot name="summary"></slot>
<slot style="display: none"></slot>`;
    }

    static get observedAttributes() {
      return ["open"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "open")
        this.shadowRoot.children[1].style.display = (newValue === null ? "none" : "block");
    }
  }

  class MySummary extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<div style="display: inline-block">></div>
<slot></slot>`;
      this.addEventListener("click", this.onClick.bind(this), true);
    }

    _toggleParent() {
      if (!(this.parentNode instanceof MyDetails))
        return;
      const open = !this.parentNode.hasAttribute("open");
      //1. rotate the ">" open/closed arrow in the my-summary element shadowDom
      this.shadowRoot.children[0].style.transform = open ? "rotate(90deg)" : "";
      //2. show/hide the "open" attribute on the parent my-details element
      open ? this.parentNode.setAttribute("open", "") : this.parentNode.removeAttribute("open");
      //3. dispatch the "toggle" event after the state change has occured
      this.parentNode.dispatchEvent(new CustomEvent("toggle", {composed: true, bubbles: false}));
    }

    onClick(e) {
      e.preventDefault();
      const taskId = setTimeout(this._toggleParent.bind(this), 0);
      e.preventDefault = function () {
        clearTimeout(taskId);
      }
    }
  }

  customElements.define("my-details", MyDetails);
  customElements.define("my-summary", MySummary);
</script>

<div>
  <my-details>
    <my-summary slot="summary">Hello</my-summary>
    Sunshine!!
  </my-details>
</div>
<script>

  const div = document.querySelector("div");
  const details = document.querySelector("my-details");
  const summary = document.querySelector("my-summary");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase, "my-details is " + (details.open ? "open" : "closed"));
  }

  function preventD(e) {
    console.log("calling: " + e.type + ".preventDefault()");
    e.preventDefault();
  }

  div.addEventListener("click", log, true);
  details.addEventListener("click", log, true);
  summary.addEventListener("click", log);
  details.addEventListener("click", log);
  div.addEventListener("click", log);
  // div.addEventListener("click", preventD);

  div.addEventListener("toggle", log, true);
  details.addEventListener("toggle", log);
</script>
```

## References:

 * 