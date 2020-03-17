# WhatIs: aClick

`click` on an `<a href>` element.
`click` on a `<input type="checkbox">`
`<check-box>`

`click` on a button on an `<summary>` element
`click` on a button on an `<option>` element

`click` on a `<input type="color">`
`click` on a `<input type="time">`
`click` on a `<input type="radio">`
`click` on a `<input type="file">`
`click` on a `<input type="reset">` or `<button type="reset">`
`click` on a `<input type="submit">` or `<button type="submit">`
`click` on a button on an `<audio>` or `<video>` element
`click` on a button on an `<img usemap>` element


## Demo: ThingOfBeauty

```html
<script src="../../1d2_defaultAction/demo/addDefaultAction.js"></script>

<div href="#hello">
  hello
  <a href="#coronavirus">coronavirus</a>
</div>
<a href="#goodbye">
  goodbye
  <span href="#world">world</span>
</a>

<script>
  function addDivHrefAction(e) {
    for (let element of e.composedPath()) {
      if (element instanceof HTMLElement && element.matches("div[href], span[href]")) {
        e.addDefaultAction(function (e) {
          console.log("action is triggered by: ", e);
          location.href = new URL(this.getAttribute("href"), document.baseURI).href;
        }.bind(element), {preventable: element, raceEvents: ["dblclick"]});
        return;
      }
    }
  }

  window.addEventListener("click", addDivHrefAction, true);
</script>
```