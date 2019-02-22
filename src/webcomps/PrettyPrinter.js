function PRready(delay, cb) {
  if (window.PR === undefined)
    return setTimeout(() => PRready(delay, cb));
  cb();
}

function addSyncScript(src){
  const pp = document.createElement("script");
  pp.src = src;
  document.body.appendChild(pp);
}

addSyncScript("https://cdn.rawgit.com/google/code-prettify/master/src/prettify.js");

class PrettyPrinter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<link rel="stylesheet" type="text/css" href="https://cdn.rawgit.com/google/code-prettify/master/src/prettify.css">
<pre class="prettyprint"></pre>
<style>

  pre {
    position: relative;
    overflow: scroll; 
    background: white;
  }
  .extra {
    background: white;
    border: 2px dotted grey;
  }
  .com:hover {
    cursor: help;
  }
</style>                                                                 
<!--
we don't want to do this, as it would load the script in every web component.
<script src="https://cdn.rawgit.com/google/code-prettify/master/src/prettify.js" defer="defer"></script>
-->
`;
    this.toggleCommentClosure = this.toggleComment.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this.toggleCommentClosure);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this.toggleCommentClosure);
  }

  static get observedAttributes() {
    return ["href"];
  }

  async attributeChangedCallback(name, oldVal, newVal) {
    if (name !== "href")
      return;
    var data = await fetch(newVal);
    var text = await data.text();
    PRready(200, () => {
      this.shadowRoot.children[1].innerHTML = PR.prettyPrintOne(text);
      let i = 1;
      let comment = getCommentText(this.shadowRoot, i);
      while (comment) {
        let div = makeCommentDiv(i, comment);
        this.shadowRoot.children[1].appendChild(div);
        comment = getCommentText(this.shadowRoot, ++i);
      }
    });
  }

  toggleComment(e) {
    var num = getCommentNumber(e.target);
    if (num === undefined)
      return;
    var active = this.shadowRoot.querySelector("#extra" + num);
    if (!active)
      return;
    active.style.left = e.offsetX + "px";
    active.style.top = e.offsetY + "px";
    active.style.display === "none" ?
      active.style.display = "block" :
      active.style.display = "none";
  }
}

function getCommentText(root, num) {
  var regex = new RegExp("^\/\/(" + num + ")\\.\\s");
  var coms = root.querySelectorAll("span.com");
  for (var i = 0; i < coms.length; i++) {
    var com2 = coms[i];
    var hit2 = regex.exec(com2.innerText);
    if (hit2) {
      return getCommentTextLines(com2);
    }
  }
  return null;
}

function getCommentTextLines(com2) {
  let res = [com2];
  var regex = new RegExp("^\/\/\\s\\s\\s");
  while (
    com2.nextSibling &&
    com2.nextSibling.nextSibling &&
    com2.nextSibling.nextSibling.classList.contains("com") &&
    regex.exec(com2.nextSibling.nextSibling.innerText)
    ) {
    res.push(document.createElement("br"));
    res.push(com2.nextSibling.nextSibling);
    com2 = com2.nextSibling.nextSibling;
  }
  return res;
}

function makeCommentDiv(num, addOnComment, x, y) {
  var div = document.createElement("div");
  div.id = "extra" + num;

  for (let i = 0; i < addOnComment.length; i++)
    div.appendChild(addOnComment[i]);
  div.classList.add("extra");
  div.style.position = "absolute";
  div.style.display = "none";
  div.style.top = y + "px";
  div.style.left = x + "px";
  return div;
}

function getCommentNumber(el) {
  if (!el.classList.contains("com"))
    return;
  var hit = /^\/\/\[(\d+)\]/.exec(el.innerText);
  return hit ? hit[1] : undefined;
}

customElements.define("pretty-printer", PrettyPrinter);