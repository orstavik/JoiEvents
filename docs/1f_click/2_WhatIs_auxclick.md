# WhatIs: `auxclick`?

> `auxclick` is not supported by Safari (cf. Apple desktop with single button mice) nor IE. 

The `auxclick` event is triggered when a non-primary pointer button is pressed.

Today, "normal functions" for mouse buttons in Windows/Linux are:
1. primary/left: "normal" `click` action such as open link in the same tab or toggle an `<input type="checkbox">`.
2. secondary/right: open context menu.
3. third/middle (wheel button): open link in new tab, paste text in input elements.
   
In principle, the `auxclick` event could be considered as the trigger for a) context menu, b) open link in new tab, and c) paste text. But, in practice it is not.

**`contextmenu` controls `show context menu`**. As we have seen in an earlier chapter, is the `contextmenu` triggered by `mousedown` and the `auxclick` event will only show up if the default action of the `contextmenu` is blocked. Thus, `contextmenu` is an *alternative to* `auxclick`, that is triggered even earlier than `auxclick` from the `mousedown` event.

**`mouseup` controls `beforeinput`**. `mouseup.preventDefault()` blocks "paste text on wheel button click". The `auxclick` event dispatch is in principle running parallel to (and queued immediately before) the event cascade of `beforeinput` => "paste text" => `input`.

**`auxclick` controls `open link in new tab`**. The only action that can be blocked from `auxclick` is "open link in new tab" wheel button click. Thus, if you want to completely block link click navigation, then you need to call `.preventDefault()` on both `click` and `auxclick`.

## Demo: `auxclick`

```html
<body style="height: 200vh">
<a href="#no-prevent-default">no preventDefault()</a>
<hr>
<a href="#mousedown-prevented">mousedown.preventDefault()</a>
<hr>
<a href="#click-prevented">click.preventDefault()</a>
<hr>
<a href="#contextmenu-prevented">contextmenu.preventDefault()</a>
<hr>
<a href="#auxclick-prevented">auxclick.preventDefault()</a>
<hr>
Click with the left, right and middle (wheel) mouse buttons on the links above to test click behavior.
<hr>
<textarea>Try to paste text from the clipboard here using the middle mouse button. It works in some browsers/OSes.</textarea>
<textarea id="textarea-auxclick-prevented">textarea with auxclick.preventDefault()</textarea>
<textarea id="textarea-beforeinput-prevented">textarea with beforeinput.preventDefault()</textarea>
<hr>
<script>
  const mousedown_prevented = document.querySelector('a[href="#mousedown-prevented"]');
  const click_prevented = document.querySelector('a[href="#click-prevented"]');
  const contextmenu_prevented = document.querySelector('a[href="#contextmenu-prevented"]');
  const auxclick_prevented = document.querySelector('a[href="#auxclick-prevented"]');

  const textarea_auxclick_prevented = document.querySelector('#textarea-auxclick-prevented');
  const textarea_beforeinput_prevented = document.querySelector('#textarea-beforeinput-prevented');

  window.addEventListener("mousedown", e => console.log("mousedown"));
  window.addEventListener("click", e => console.log("click"));
  window.addEventListener("contextmenu", e => console.log("contextmenu"));
  window.addEventListener("auxclick", e => console.log("auxclick"));

  mousedown_prevented.addEventListener("mousedown", e => e.preventDefault());
  click_prevented.addEventListener("click", e => e.preventDefault());
  contextmenu_prevented.addEventListener("contextmenu", e => e.preventDefault());
  auxclick_prevented.addEventListener("auxclick", e => e.preventDefault());

  textarea_auxclick_prevented.addEventListener("auxclick", e => e.preventDefault());
  textarea_beforeinput_prevented.addEventListener("beforeinput", e => e.preventDefault());
</script>
</body>
```

## Event branching and event competition

For any `mousedown` and `mouseup` sequence, there are several potential outcomes that can either run in parallel or exclude each other. These outcomes are triggered by a trigger event; and the outcomes themselves constitute an event-action cascade or action-event cascade (that may only contain one event or one action).  

When *one* trigger event can induce *multiple* events/actions, then the event cascade **branches** at the trigger event. There are two types of event branches:
1. parallel event branches and
2. competing event branches.  

### 1. Parallel event branching: `auxclick` && `beforeinput`

Parallel event branching occurs when *one* trigger event induce *multiple, parallel* sequence of events/actions. But. As the event loop is linear, these *parallel* sequences must be listed linear, placing one branch in front of the other in the event loop.

For example, a mouse wheel button click an input element produces two parallel chain of events: 1) `auxclick` and 2) (`beforeinput` => "update input" => `input`). These two event sequences  are not one unit: first, they both occur independently from each other in other contexts; and second, they are not connected technically neither, via for example `.preventDefault()`.

However, to materialize, both event sequences need to be queued linearly in the event loop. So when the browser runs the events they appear as part of *one* event cascade: `mousedown` => `mouseup` => (`auxclick`) && (`beforeinput` => "update input" => `input`), while they in fact are two branches queued one before the other (`auxclick` before `beforeinput` => "update input" => `input`). 
 
It is customary that the simplest branch is queued first, if no other causal relationship, UI logic should dictate otherwise. In this case that would be `auxclick`. A likely rationale for this order would be the hope that fewer/no state mutations of the DOM would occur during the propagation of the first branch *before* the second branch have had the time to begin its processing.
 
It is worth noting that calling `.preventDefault()` on the trigger event before the event cascade branches can have different effect on different branches. For example, calling `mouseup.preventDefault()` will block the `beforeinput` event and the remainder of the second branch, while at the same time having no effect on the first branch and let `auxclick` event pass unhindered.   

### 2. Event competition: `auxclick` || `contextmenu`

Competing event branches occur when 1) two event controllers depend on the same (set of) trigger events and 2) one event controller either deliberately or as a side-effect block the other event controller.

`auxclick` and `contextmenu` **compete** for the same `mousedown` event. If the `contextmenu` event controller is allowed to play out till the end, it will block the `auxclick` event from being dispatched. The browser may implement this as a direct action from the `contextmenu` event controller, but it is just as likely that `auxclick` is blocked as a side-effect of the focus being shifted to the "out-of-DOM" context menu.

From the point of view of the `mousedown` trigger event, the browser will make a choice as to whether complete the full `contextmenu` event cascade, or to dispatch the `auxclick` event. In essence, a right button mouse click either produce
1. `mousedown` => `contextmenu` => "show context menu", or   
2. `mousedown` => `contextmenu` => `mouseup` => `auxclick`

which can be described as 
 * `mousedown` => `contextmenu` => ("show context menu" || `mouseup` => `auxclick`)
 
`auxclick` will only be shown when `.preventDefault()` has been called on the `contextmenu` event.  

### 3. Event competition: `auxclick` || `click`

Another competition is between `auxclick` and `click`. Both events listen are triggered by `mousedown` and `mouseup` events, but they both exclude each other: if an `auxclick` occurs event, we should have no `click` event, and vice versa.

Choosing winner between `auxclick` and `click` is (mostly) straight forward. The two events are triggered by two sets of `mousedown` and `mouseup` events that are mutually exclusive: `click` only respond to the *primary* mouse button, and `auxclick` respond to all the other mouse buttons except the primary button.
 
But. There is one situation where `click` and `auxclick` still can get into trouble: what happens when the user presses more than one button at the same time? There are several alternative strategies to solve this conundrum:
1. Both wins. The event controllers for both `click` and `auxclick` are fully parallel/transparent and ignore each other. This would mean that *two* events, both a `click` and an `auxclick`, would be dispatched when two buttons are pressed at the same time.
2. Noone wins. If a `click` or an `auxclick` begins while the other is active, then both events are cancelled. This means that if you press down two buttons at the same time, before any one finger has been lifted, then you will get *no* events.
3. First down wins. If a `click` has begun, then no `auxclick` event can be started. And vice versa. Ie. if the left mouse button is pressed down, then the event controller function managing `auxclick` would not react to the subsequent `mousedown` event until the left mouse button has been released.
4. First up wins. If both the left and right mouse button is pressed down, then only the mouse button lifted first would trigger an event, and do so regardless if it was pressed down first or second.

Which of these methods do the browsers subscribe to? To help you think it through, I would point to the following. It would most likely be bad to dispatch two mutually excluding events at more or less the same instant. So solution 1 is not desirable. Solution 2 is a clean solution, but it might cause problems for user with poor finger dexterity that might more frequently than one might imagine accidentally hit two buttons at the same time. Solution 3 therefore seems like the desired solution. One might imagine that users who accidentally press more than one mouse button most likely will have 1) more muscular control of pressing down, and 2) that the erroneous finger is most frequently pressed down after the intended finger. The only argument for choosing solution 4 over 3, as far as I can tell, would be that the user could 1) tactile sense that a second finger have accidentally pressed a button and 2) would manage to correct for this mistake by ensuring that the erroneous finger remains down until the intended finger is lifted. Chrome and Firefox chose solution 4. I personally would have selected solution 2. 

 * `mousedown` => `mousedown` => `mouseup` => (`click` || `auxclick`)   

## Demo: AuxclickController

The AuxclickController is pretty straight forward.
1. The AuxclickController listens for a sequence of `mousedown` and then `mouseup` events for all non-primary mouse buttons. For each such sequence, it aims to dispatch an `auxclick` event.
2. Unfortunately, there is no clean code solution to queue the `my-auxclick` event in the event loop before the `beforeinput` event without at the same time implementing an InputController in the same demo. The demo therefore breaks this criteria for the AuxclickController and dispatch `auxclick` event *after* `beforeinput` event, instead of *before*.
3. The task of opening a link in a new tab would be a default action for the `auxclick` event. We implement a simplified version of this that calls `window.open(url, '_blank')` on the `my-auxclick` target if that target is an `a[href]` element.
4. The main challenge for the AuxclickController is to handle competition, ie. detect the situations where it should *not* dispatch the `auxclick` event.
   1. As seen in the previous chapter, any `click` event being dispatched after a `mousedown` for a non-primary mouse button will effectively cancel any and all `auxclick` events that might have been started in the meantime.
   2. If a `contextmenu` event is dispatched and not blocked, then the AuxclickController should queue a task that can enable it to check whether or not a `contextmenu` within its event sequence was prevented or not.    

```html
<a href="#no-prevent-default">no preventDefault()</a>
<hr>
<a href="#mousedown-prevented">mousedown.preventDefault()</a>
<hr>
<a href="#click-prevented">click.preventDefault()</a>
<hr>
<a href="#contextmenu-prevented">contextmenu.preventDefault()</a>
<hr>
<a href="#auxclick-prevented">auxclick.preventDefault()</a>
<hr>
Click with the left, right and middle (wheel) mouse buttons on the links above to test click behavior.
<hr>
<textarea cols="30" rows="5">Try to paste text from the clipboard here using the middle mouse button. It works in some browsers/OSes.</textarea>
<textarea cols="30" rows="5" id="textarea-auxclick-prevented">textarea with auxclick.preventDefault()</textarea>
<textarea cols="30" rows="5" id="textarea-mouseup-prevented">textarea with mouseup.preventDefault()</textarea>
<input type="text" value="paste click here">
<hr>
<a href="#omg">omg <input type="text" value="wtf"></a>.

<script>
  (function () {
    function findCommonTarget(pathA, pathB) {
      pathA = pathA.slice().reverse();
      pathB = pathB.slice().reverse();
      let i;
      for (i = 0; i < pathA.length && i < pathB.length; i++) {
        if (pathA[i] !== pathB[i])
          return pathA[i - 1];
      }
      return pathA[i - 1];
    }

    const AuxclickController = {
      state: undefined,
      onMousedown: function (e) {
        if (e.button === 0)
          return;
        AuxclickController.state = {
          mousedownPath: e.composedPath(),
          mousedownButton: e.button,
        };
        if (e.button === 2)
          AuxclickController.state.timer = setTimeout(() => AuxclickController.state = undefined);
        AuxclickController.mousedownPath = e.composedPath();
        AuxclickController.mousedownButton = e.button;
        window.removeEventListener("mousedown", AuxclickController.onMousedown, true);
        window.addEventListener("contextmenu", AuxclickController.onContextmenu, true);
        window.addEventListener("mouseup", AuxclickController.onMouseup, true);
        AuxclickController.mousedownPath[0].addEventListener("DOMNodeRemoved", AuxclickController.reset, true);
      },
      onMouseup: function (e) {
        if (e.button === 0)                     //left mouse button up, will cancel ongoing auxclick
          return AuxclickController.reset();
        if (e.button !== AuxclickController.state.mousedownButton) //this is a bit naive
          return AuxclickController.reset();
        if (AuxclickController.state.contextmenu && !AuxclickController.state.contextmenu.defaultPrevented)
          return AuxclickController.reset();
        //auxclick won the competition
        const target = findCommonTarget(AuxclickController.mousedownPath, e.composedPath());
        const myAuxclick = new MouseEvent("my-auxclick", {composed: true, bubbles: true, cancelable: true});
        setTimeout(() => target.dispatchEvent(myAuxclick), 0);
        AuxclickController.reset();
      },
      onContextmenu: function (e) {
        AuxclickController.state.contextmenu = e;
      },
      reset: function () {
        window.removeEventListener("contextmenu", AuxclickController.onContextmenu, true);
        window.removeEventListener("mouseup", AuxclickController.onMouseup, true);
        window.addEventListener("mousedown", AuxclickController.onMousedown, true);
        AuxclickController.mousedownPath[0].removeEventListener("DOMNodeRemoved", AuxclickController.reset, true);
        AuxclickController.mousedownPath = undefined;
      }
    };

    window.addEventListener("mousedown", AuxclickController.onMousedown, true);
  })();

  const mousedown_prevented = document.querySelector('a[href="#mousedown-prevented"]');
  const click_prevented = document.querySelector('a[href="#click-prevented"]');
  const contextmenu_prevented = document.querySelector('a[href="#contextmenu-prevented"]');
  const auxclick_prevented = document.querySelector('a[href="#auxclick-prevented"]');

  const textarea_auxclick_prevented = document.querySelector('#textarea-auxclick-prevented');
  const textarea_mouseup_prevented = document.querySelector('#textarea-mouseup-prevented');

  window.addEventListener("mousedown", e => console.log("mousedown"));
  window.addEventListener("mouseup", e => console.log("mouseup"));
  window.addEventListener("contextmenu", e => console.log("contextmenu"));
  window.addEventListener("beforeinput", e => console.log("beforeinput"));
  window.addEventListener("my-auxclick", e => console.log("my-auxclick"));
  window.addEventListener("auxclick", e => console.log("auxclick"));
  window.addEventListener("click", e => console.log("click"));

  function preventD(e) {
    console.log(e.type + ".preventDefault()");
    e.preventDefault();
  }

  mousedown_prevented.addEventListener("mousedown", preventD);
  click_prevented.addEventListener("click", preventD);
  contextmenu_prevented.addEventListener("contextmenu", preventD);
  auxclick_prevented.addEventListener("auxclick", preventD);

  textarea_auxclick_prevented.addEventListener("auxclick", preventD);
  textarea_mouseup_prevented.addEventListener("mouseup", preventD);
</script>
```

## References

 * dunno