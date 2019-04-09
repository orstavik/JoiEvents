async function getText(src){
  const data = await fetch(src);
  return await data.text();
}

class CodeDemo extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<flip-flop>
  <code-mirror-view slot="one"></code-mirror-view>
  <code-runner slot="two"></code-runner>
</flip-flop>`;
  }

  static get observedAttributes(){
    return ["src"];
  }

  async attributeChangedCallback(name, oldValue, newValue){
    if (name === "src"){
      const code = await getText(newValue);
      this.shadowRoot.querySelector("code-mirror-view").setAttribute("src", code);
      this.shadowRoot.querySelector("code-runner").loadHTMLSync(code, newValue);
    }
  }
}
customElements.define("code-demo", CodeDemo);


var template = `
<style>
  :host {
    border: 1.5px solid lightgrey;
    position: relative;
    overflow: hidden;
    display: block;
    height: auto;
  }
  #flip{
    position: absolute;
    top: 0; 
    right: 0;
    background: blue;
    color: white;
    font-weight: bold;
    font-family: sans-serif;
    margin: -10px -100px 0 0;
    padding: 20px 100px 10px 100px;
    transform: rotate(45deg);
    z-index: 30;
  }
  .inactive{
    display: none;
  }
</style>
  <slot name="one"></slot>
  <slot name="two" class="inactive"></slot>
<div id="flip">flip</div>
`;

class FlipFlop extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = template;
    this._button = this.shadowRoot.querySelector("#flip");
    this._button.addEventListener("click", this.toggleView.bind(this));
  }

  toggleView(){
    this._button.innerText = (this._button.innerText === "flip") ? "flop": "flip";
    this.shadowRoot.querySelector("slot[name='one']").classList.toggle("inactive");
    this.shadowRoot.querySelector("slot[name='two']").classList.toggle("inactive");
  }
}
customElements.define("flip-flop", FlipFlop);

function globalPathExists(path){
  var segs = path.split(".");
  for (var obj = window; segs.length;){
    obj = obj[segs.shift()];
    if (!obj)
      return false;
  }
  return true;
}

function addScript(src){
  const pp = document.createElement("script");
  pp.src = src;
  document.body.appendChild(pp);
}

function runAfterDependencies(deps, delay, cb) {
  while (deps.length){
    if (globalPathExists(deps[0]))
      deps = deps.slice(1);
    else
      return setTimeout(() => runAfterDependencies(deps, delay, cb));
  }
  cb();
}

function loadAfterDependencies(deps, delay, src) {
  runAfterDependencies(deps, delay, function(){addScript(src);});
}

if (!globalPathExists("CodeMirror"))
  addScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/codemirror.min.js");
if (!globalPathExists("CodeMirror.modes.javascript"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/javascript/javascript.js");
if (!globalPathExists("CodeMirror.modes.css"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/css/css.js");
if (!globalPathExists("CodeMirror.modes.xml"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/xml/xml.js");
if (!globalPathExists("CodeMirror.modes.htmlmixed"))
  loadAfterDependencies(["CodeMirror"], 200, "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/mode/htmlmixed/htmlmixed.js");

class CodeMirrorView extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.43.0/codemirror.css">
<div id="code"></div> 
<style>
  :host{
    display: block;
    min-height: 600px;
  }
</style> 
`;
  }

  addSource(src){
    var codeEl = this.shadowRoot.querySelector("#code");
    var mixedMode = {
      name: "htmlmixed",
      scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i, mode: null},
        {matches: /(text|application)\/(x-)?vb(a|script)/i, mode: "vbscript"}]
    };
    var myCodeMirror = CodeMirror(codeEl, {
      value: src,
      mode:  mixedMode
    });
    codeEl.children[0].style.height = "auto";
  }

  static get observedAttributes(){
    return ["src"];
  }

  attributeChangedCallback(name, oldValue, newValue){
    if (name === "src"){
      runAfterDependencies(["CodeMirror.modes.javascript", "CodeMirror.modes.css", "CodeMirror.modes.xml", "CodeMirror.modes.htmlmixed"], 200, this.addSource.bind(this, newValue));
    }
  }
}
customElements.define("code-mirror-view", CodeMirrorView);


const template2 = document.createElement("template");
template2.innerHTML = `
   <style>
     :host {
       display: block;
     }
     iframe {
       width: 100%;
       height: 100%;
     }
   </style>
   <iframe style="min-width: 100px;"></iframe>
`;

class CodeRunner extends HTMLElement {

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.appendChild(template2.content.cloneNode(true));
  }

  loadScriptSync(code) {
    const iframe = this.shadowRoot.children[1];
    const iframeWin = iframe.contentWindow || iframe;
    this._iframeDoc = iframe.contentDocument || iframeWin.document;
    this._iframeDoc.open();
    this._iframeDoc.write("\<i>\<\/i>\<script>"+code+"\<\/script>");   //adding the <i> to make sure the script is written to the document.body, and not the document.head
    this._iframeDoc.close();
  }

  loadHTMLSync(code, base) {
    const iframe = this.shadowRoot.children[1];
    const iframeWin = iframe.contentWindow || iframe;
    this._iframeDoc = iframe.contentDocument || iframeWin.document;
    this._iframeDoc.open();
    this._iframeDoc.write("<base href='"+base+"'/>\n" + code);
    this._iframeDoc.close();
  }

  loadCodeSyncFromMap(codeFiles){
    let code = "";
    for (let file of codeFiles) {
      if (file.filename.endsWith(".js"))
        code += "\<i>\<\/i>\<script>"+file.content+"\<\/script>";
      else if (file.filename.endsWith(".html"))
        code += file.content;
      // else ignore
    }
    this.loadHTMLSync(code/*, todo which base*/);
  }
}
customElements.define("code-runner", CodeRunner);