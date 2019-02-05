function PRready(cb){
  window.PR === undefined ?
    setTimeout(()=> PRready(cb), 200) :
  cb();
}

const pp = document.createElement("script");
pp.src= "https://cdn.rawgit.com/google/code-prettify/master/src/prettify.js";
document.body.appendChild(pp);

class PrettyPrinter extends HTMLElement {
  constructor(){
    super();
    PRready(()=> console.log("PR"));
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

  connectedCallback(){
    this.shadowRoot.addEventListener("click", this.toggleCommentClosure);
  }

  disconnectedCallback(){
    this.shadowRoot.removeEventListener("click", this.toggleCommentClosure);
  }

  static get observedAttributes(){
    return ["href"];
  }

  async attributeChangedCallback(name, oldVal, newVal){
    if (name !== "href")
      return;
    var data = await fetch(newVal);
    var text = await data.text();
    PRready(() => this.shadowRoot.children[1].innerHTML = PR.prettyPrintOne(text));
  }

  toggleComment(e){
    var num = getCommentNumber(e.target);
    if (num === undefined)
      return;
    var active = this.shadowRoot.querySelector("#extra"+num);
    if (active)
      return active.remove();
    var addOnComment = this.getCommentText(num);
    var commentDiv = makeCommentDiv(num, addOnComment, e.offsetX, e.offsetY);
    this.shadowRoot.appendChild(commentDiv);
  }

  getCommentText(num){
    var regex = new RegExp("^\/\/("+ num + ")\\.\\s");
    var coms = this.shadowRoot.querySelectorAll("span.com");
    for (var i = 0; i < coms.length; i++) {
      var com2 = coms[i];
      var hit2 = regex.exec(com2.innerText);
      if (hit2)
        return com2.innerText.substr(hit2[0].length);
    }
    return null;
  }
}

function makeCommentDiv(num, addOnComment, x, y){
  var div = document.createElement("div");
  div.id = "extra"+num;
  div.innerText = addOnComment;
  div.classList.add("extra");
  div.style.position = "absolute";
  div.style.top = y + "px";
  div.style.left = x + "px";
  return div;
}

function getCommentNumber(el){
  if (!el.classList.contains("com"))
    return;
  var hit = /^\/\/\[(\d+)\]/.exec(el.innerText);
  return hit ? hit[1] : undefined;
}
customElements.define("pretty-printer", PrettyPrinter);