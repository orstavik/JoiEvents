## Bug: `composed: true` `input`

> The `beforeinput` and `input` events are the "interpretation of primitive user-driven events *within* the context of an input element". `beforeinput` and `input` alert about a coming/occured state change of the input element. Yes, the user-driven events are global, but these events are signified in the system as the more primitive `click`, `keydown`, `paste`, or `mousedown`. Example of native input elements are `<textarea>` and `<select>`. 

Some of the most important HTML elements we have is the form and input elements. Input elements require both a lot of (reusable) JS functions and a lot of (reusable) CSS style. And, there are lots of alternative use-cases for input elements: suggestive writing, spellchecking, hotkeys, automatic translation, AI enhancement, dynamic generation of selections, dynamic visualization during input, wysiwig/code editors, domain specific "pickers" (cf. date and color pickers), and lots lots more.

Custom input is one of the most important use-cases for web components, on par with other top domains such as custom output and custom layout. It is as if web components were designed for custom input elements who likely need to encapsulate both custom structure (cf. `<select>`), custom style, and not to mention custom JS functionality. Custom input elements is hand in glove for web components.

But. There are problems too. Managing user input, especially from keyboard, can be a hornets nest of if-this-then-thats: there are thousands of different languages; there are conventions for deadkeys and hotkeys; and then different OSes have different modal keys too. To (re-)build "normal interpretation" of a series of `keydown` events and turn them into normal characters and commands in an input element will most likely either block progress in the entire app (for the perfectionists among us) or produce a component that will constantly require bug-fixes (for the more trigger-happy developers).

The solution is *not* to avoid making custom input/output elements; the solution is to instead of (re-)building the interpretation of `keydown` events from scratch, to instead build on top of native input/output elements. The solution is to wrap a custom web component around for example a `<textarea>` and then to extend and/or filter this element's interpretation of the `keydown` events.

## Demo: `<hotkey-textarea>`

```html
<hotkey-textarea></hotkey-textarea>
<p>write "if" and then enter to see a hotkey in action!</p>

<script>
  class HotkeyTextarea extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100px;
            height: 100px;
          }
          textarea {
            width: 100%;
            height: 100%;
          }
        </style>
        <textarea></textarea>
      `;
      this._textarea = this.shadowRoot.children[1];
      // this.shadowRoot.addEventListener("focusin", e => this._textarea.focus());
      // //due to the strange composed behavior of focus events, this event will not leak out.
      this.shadowRoot.addEventListener("beforeinput", e => this.maybeHotkey(e));
      //input events leaks out, unfortunately.
    }

    //"enter" is a hotkey after the word "if"
    // otherwise, enter produces a normal enter
    maybeHotkey(e) {
      if (e.inputType === "insertLineBreak") {
        if (this._textarea.value.endsWith("if")) {
          e.preventDefault();
          return this.updateText(e, "(){}");
        }
      }
      return this.updateText(e, undefined);
    }

    updateText(e, txt) {
      const beforeInput = new CustomEvent("my-beforeinput", {composed: false, bubbles: true});
      beforeInput.data = txt || e.data;
      beforeInput.inputType = e.inputType;
      this.dispatchEvent(beforeInput);
      if (beforeInput.defaultPrevented)
        return e.preventDefault();
      if (txt)
        this._textarea.value += txt;
      const input = new CustomEvent("my-input", {composed: false, bubbles: true});
      input.data = txt || e.data;
      input.inputType = e.inputType;
      this.dispatchEvent(input);
    }
  }

  customElements.define("hotkey-textarea", HotkeyTextarea);

  window.addEventListener("beforeinput", e => console.log(e.type, e.inputType, e.data), true);
  window.addEventListener("input", e => console.log(e.type, e.inputType, e.data), true);
  window.addEventListener("my-beforeinput", e => console.log(e.type, e.inputType, e.data), true);
  window.addEventListener("my-input", e => console.log(e.type, e.inputType, e.data), true);
</script>
```   

## Should `input` be composed?

There is a problem in the demo above. The `beforeinput` and `input` events are `composed: true`. This means that even though a `<textarea>` element is used inside a shadowDOM, the events that the input element uses to alert its document context about its changing state propagates to other lightDOMs above. But why? The `beforeinput` and `input` events only alert about a state change of an element, right? `change` is `composed: false`, so why should `input` be `composed: true`? `reset` is `composed: false`, so why should `beforeinput` be `composed: true`?
 
#### Use-case for `composed: true`

My guess is that the use-case for having `beforeinput` and `input` be `composed: false` is to avoid boilerplate code. For example, imagine that you make a web component that only wish to style a native input element. Encapsulate some CSS, add a label, and an animation. But, you do not wish to dramatically alter the "native input mechanisms" itself, you do not wish to change the content or remove any `input` events.

In this situation, your web component with the internal input element will simply pass its `beforeinput` and `input` events out as if there internal changes inside the web component also echoed the external changes you would want. Your component is leaking the state change of an internal component because that state change perfectly mirrors the corresponding state of the web component it is part of. Benefit: no need to a) listen to the internal `beforeinput` and `input` events, b) clone these events into new event objects, and then c) dispatch the cloned input events on the host node.

Note. It might be confusing that some state changes are leaking while others aren't. If you wish to leak the events signifying the state change of the element, then for example the `change` event should be manually re-dispatched to the host node. Also. `<form>` group behavior such as a) `click`ing on a `<label>` toggles the status of an associated checkbox, b) radiobuttons, and c) `<form>` reset are largely unresolved in this use-case. 
 
## Alternative solution: `composed: false` becomes `composed: true`

The better solution if one wishes to avoid lots of boilerplate code for passing originally composed events *one* lightDOM up, would be to simply redispatch the non-composed event on the host node as its propagation ends. Inside a web component's shadowDOM it is simple to control the end of an events propagation, and at that point to be able to call `this.shadowRoot.addEventListener("my-beforeinput", e=> this.dispatchEvent(e))` would be enough, if the event objects could be retargeted to the host node of the context in which they originate. This would almost remove
 
There are real reasons, as the demo above illustrate that you want to keep `beforeinput` and `input` local to the document in which they are targeted.


The input events are from my perspective perfect candidates for being .


But, `beforeinput`, `input` are all `composed: `**`true`**.

It is hard to find a good reason why the events associated with input that are tailored to a particular event should be allowed to transgress past shadowDOM borders. It is not hard to imagine a custom UIInterface element that might rely on a native input element of some kind to convert `keypress` combinations into text, which would produce lots of input events, but that only uses these events internally as an efficient and simple means to let the user generate text that is then visualized in a different way. If the developer of an input element inside its shadowDOM wished to let the outside know about its text manipulation, they should dispatch their own events. `beforeinput` and `input` and `change` etc are bleeding.

The `keypress` and `compositionstart` and wheel `click` events are user-generated. The interpreted `beforeinput` and `change` and `cut` and `copy` are not.



When these events are directed at the `window` node, it is not so simple to see their *global* nature and their potential relevance across multiple DOM contexts to functions inside other DOM contexts. 
 
These events can have relevance for elements located in any DOM. And if they are     
In web speak, these events are called **`composed`**.    

This means that some events should propagate both 
 
For events that `target` an element in a DOM above the shadowDOM of a web component, this is not a problem because the event will never propagate into the shadowDOM. But, what about internal events inside a web component? If they propagated from the This is the  

## Demo: `<hotkey-textarea>`

In this demo we show the use-case of using a `<textarea>` element inside a shadowDOM to create a custom input element with a hotkey capability: `<hotkey-textarea>`.

Convert the input into an smart-textarea: 
1. " hte "=>" the " if written within a second.
2. "ifj"=>"if(){}". The "j" should produce no "beforeinput" event.   



```html
<hotkey-textarea></hotkey-textarea>
<p>write "if" and then enter to see a hotkey in action!</p>

<script>
  class HotkeyTextarea extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100px;
            height: 100px;
          }
          textarea {
            width: 100%;
            height: 100%;
          }
        </style>
        <textarea></textarea>
      `;
      this._textarea = this.shadowRoot.children[1];
      // this.shadowRoot.addEventListener("focusin", e => this._textarea.focus());
      // //due to the strange composed behavior of focus events, this event will not leak out.
      this.shadowRoot.addEventListener("beforeinput", e => this.maybeHotkey(e));
      //input events leaks out, unfortunately.
    }

    //"enter" is a hotkey after the word "if"
    // otherwise, enter produces a normal enter
    maybeHotkey(e) {
      if (e.inputType === "insertLineBreak") {
        if (this._textarea.value.endsWith("if")) {
          e.preventDefault();
          return this.updateText(e, "(){}");
        }
      }
      return this.updateText(e, undefined);
    }

    updateText(e, txt) {
      const beforeInput = new CustomEvent("my-beforeinput", {composed: false, bubbles: true});
      beforeInput.data = txt || e.data;
      beforeInput.inputType = e.inputType;
      this.dispatchEvent(beforeInput);
      if (beforeInput.defaultPrevented)
        return e.preventDefault();
      if (txt)
        this._textarea.value += txt;
      const input = new CustomEvent("my-input", {composed: false, bubbles: true});
      input.data = txt || e.data;
      input.inputType = e.inputType;
      this.dispatchEvent(input);
    }
  }

  customElements.define("hotkey-textarea", HotkeyTextarea);

  window.addEventListener("beforeinput", e => console.log(e.type, e.inputType, e.data), true);
  window.addEventListener("input", e => console.log(e.type, e.inputType, e.data), true);
  window.addEventListener("my-beforeinput", e => console.log(e.type, e.inputType, e.data), true);
  window.addEventListener("my-input", e => console.log(e.type, e.inputType, e.data), true);
</script>
```

When you write "if" followed by two enter key strokes, you get the following sequence:

```
beforeinput insertText i
my-beforeinput insertText i
my-input insertText i
input insertText i

beforeinput insertText f
my-beforeinput insertText f
my-input insertText f
input insertText f

beforeinput insertLineBreak null
my-beforeinput insertLineBreak (){}
my-input insertLineBreak (){}

beforeinput insertLineBreak null
my-beforeinput insertLineBreak null
my-input insertLineBreak null
input insertLineBreak null
```



Use case for why input events should be composed false.
Web component that masks an input. Whenever it receives focus, then it shifts the focus to a hidden textarea inside it, that it then grabs all text changes from, it uses that text to update a custom text output, and then alerts the user.

Filtered-textarea, my-textarea, customized-textarea
It is easier to alter a textarea based on the existing interpretation of keydown events than to try to model the same interpretation yourself. Dead keys etc are hard to

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>

<nor-textarea>hoer haar haer</nor-textarea>

<script>
  class NorwegianTextarea extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
        <style>
          div {
            width: 100px;
            height: 100px;
            border: 2px solid green;
            position:relative;
            background: white;
          }
          textarea {
            position: absolute;
            width: 100%;
            height: 100%;
          }
          div > div {
            width: 100%;
            height: 100%;

          }
        </style>
        <div tabindex="-1">
          <textarea>hidden value</textarea>
          <div></div>
        </div>
      `;
      this._textarea = this.shadowRoot.children[1].children[0];
      this._innerDiv = this.shadowRoot.children[1].children[1];
      this.shadowRoot.addEventListener("focusin", e => this._textarea.focus());
      //due to the strange composed behavior of focus events, this event will not leak out.
      this.shadowRoot.addEventListener("input", e => this.writeNorwegian(e));
      //this event leaks out, unfortunately.
    }

    connectedCallback() {
      window.addEventListener("DOMContentLoaded", function () {
        this._textarea.innerHTML = this.innerHTML.replace("ae", "æ").replace("oe", "ø").replace("aa", "å");
        this._textarea.value = this._textarea.innerHTML;
        this._innerDiv.innerText = this._textarea.value;
      }.bind(this));
    }

    //double-tap "aa"/"ae"/"oe" gives the Norwegian "å"/"æ"/"ø".
    //300ms delay like with the good old double-tap to zoom
    writeNorwegian(e) {
      const two = e.data;
      if (this._delayed) {

        const one = this._delayed.data;
        clearTimeout(this._delayed.timer);
        this._delayed = undefined;
        if (one === "a" && two === "a")
          this.updateText("å");
        else if (one === "a" && two === "e")
          this.updateText("æ");
        else if (one === "o" && two === "e")
          this.updateText("ø");
        else {
          this.updateText(one);
          this.updateText(two);
        }
      } else if (two === "a" || two === "o") {
        this._delayed = {
          timer: setTimeout(function () {
            this.updateText(e.data);
            this._delayed = undefined;
          }.bind(this), 300),
          data: two
        };
      } else {
        this.updateText(two);
      }
    }

    updateText(txt) {
      const beforeInput = new CustomEvent("my-beforeinput", {composed: false, bubbles: true, detail: {data: txt}});
      this.dispatchEvent(beforeInput);
      if (beforeInput.defaultPrevented)
        return;
      this._innerDiv.innerText += txt;
      const input = new CustomEvent("my-input", {composed: false, bubbles: true, detail: {data: txt}});
      this.dispatchEvent(input);
    }
  }

  customElements.define("nor-textarea", NorwegianTextarea);

  function log(e) {
    console.log(e);
  }

  window.addEventListener("beforeinput", log, true);
  window.addEventListener("input", log, true);
  window.addEventListener("my-beforeinput", log, true);
  window.addEventListener("my-input", log, true);
</script>
</body>
</html>
```

## References

 * 