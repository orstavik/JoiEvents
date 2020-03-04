# WhatIs: `mouseenter` and `mouseleave`?

The `mouseenter`/`mouseleave` event are dispatched when an element gains/looses `:hover`. The `mouseenter`/`mouseleave` events do not `bubble` and are intended as JS hooks that should be caught directly on the element inspected and not on a container element.

Technically, The `mouseenter` event fires when *the first* `mouseover` event hits an element or one of its descendant elements. The `mouseleave` event fires has been targeted by a `mouseenter` event, and then is targeted by a `mouseout` event whose `relatedTarget` is not the element itself or one of its descendants.

> See MDN for a more in depth description of `mouseenter` vs. `mouseover`.

**Tip!** The *main* events are `mouseover` and `mouseout`. `mouseenter` and `mouseleave` are filtered events of `mouseover` and `mouseout` that are duplicated and sent to multiple targets when appropriate. You can *always* accomplish what you need with `mouseover` instead of `mouseenter`, but not vice versa. But sometimes your use of `mouseover` exactly overlap with the situation in which `mouseenter` appears. In such circumstances you can rely on `mouseenter`. Thus, consider `mouseenter`  and `mouseleave` as convenience events.   
 
## Demo: 

```html
<style>
  * {margin: 0; padding: 0; border: none}
  :not(body):not(:root):hover {border-left: 5px solid green}
  #a1 {background: lightgray}
  #a2 {background: lightblue}
  #a3 {background: yellow}
  #b1 {background: lightgreen}
</style>
<div id="a1">
  a1
  <div id='a2'>
    a2
    <div id='a3'>a3</div>
  </div>
</div>
<div id="b1">b</div>

<script>
  window.addEventListener("mouseout", ()=> console.log("---"), true);
  window.addEventListener("mouseout", (e)=> console.log("mouseout on window", e.target), true);
  // window.addEventListener("mouseleave", (e)=> console.log("mouseleave on window", e.target), true);//doesn't work in Chrome
  document.addEventListener("mouseleave", (e)=> console.log("mouseleave on document", e.target), true);
  window.addEventListener("mouseover", (e)=> console.log("mouseover on window", e.target), true);
  // window.addEventListener("mouseenter", (e)=> console.log("mouseenter on window", e.target), true);//doesn't work in Chrome
  document.addEventListener("mouseenter", (e)=> console.log("mouseenter on document", e.target), true);
</script>
```

`mouseenter` and `mouseleave` don't `bubble`. So, you will not be able to capture a `mouseenter` or `mouseleave` event on the `window` element in the bubble phase. 

**Bug: Missing `mouseenter` on `window` in Chrome**. In Chrome, if you don't have an event listener for `mouseenter` or `mouseleave` on the `document` element or below, then `mouseenter` and `mouseleave` will not be dispatched to the `window` in the capture phase neither. Be aware of this when debugging, it can be a nuisance.

## Demo: MouseenterController

The MouseenterController is almost as simple as the HoverController we saw in the last chapter. The only thing to take note of is the need to explicitly filter the propagation paths, and the need to dispatch multiple `mouseenter` and `mouseleave` events.

```html
<style>
  * {margin: 0; padding: 0; border: none}
  :not(body):not(:root):hover {border-left: 5px solid green}
  #a1 {background: lightgray}
  #a2 {background: lightblue}
  #a3 {background: yellow}
  #b1 {background: lightgreen}
</style>
<div id="a1">
  a1
  <div id='a2'>
    a2
    <div id='a3'>a3</div>
  </div>
</div>
<div id="b1">b</div>

<script>
  window.addEventListener("mouseout", () => console.log("---"), true);

  window.addEventListener("mouseout", (e) => console.log("mouseout on window", e.target), true);
  document.addEventListener("my-mouseleave", (e) => console.log("mouseleave on document", e.target), true);
  window.addEventListener("mouseover", (e) => console.log("mouseover on window", e.target), true);
  document.addEventListener("my-mouseenter", (e) => console.log("mouseenter on document", e.target), true);

  (function () {

    const MouseenterController = {
      onMouseout: function (e) {
        for (let loosingHover of e.composedPath()) {
          if (!e.relatedTarget || (loosingHover instanceof Node && !loosingHover.contains(e.relatedTarget))) {
            setTimeout(function () {
              loosingHover.dispatchEvent(new MouseEvent("my-mouseleave", {composed: true}));
            }, 0);
          }
        }
      },
      onMouseover: function (e) {
        for (let gainingHover of e.composedPath()) {
          if (!e.relatedTarget || (gainingHover instanceof Node && !gainingHover.contains(e.relatedTarget))) {
            setTimeout(function () {
              gainingHover.dispatchEvent(new MouseEvent("my-mouseenter", {composed: true}));
            }, 0);
          }
        }
      },
    };
    window.addEventListener("mouseover", MouseenterController.onMouseover);
    window.addEventListener("mouseout", MouseenterController.onMouseout);
  })();
</script>
```

The implementation above is not accurate. First of all, it doesn't queue the `mouseenter` and `mouseleave` in the right sequential order: the native `mouseout` are dispatched before `my-mouseenter`. 

### What is a difference between `mouseenter`/`mouseleave` vs `mouseover`/`mouseout` ?

* `mouseover` / `mouseout` events triggers even when we go from the parent element to a child element. The browser assumes that the mouse can be only over one element at one time – the deepest one. 

* `mouseenter` / `mouseleave` event triggers when the mouse comes in and out the element as a whole. 
    1. `mouseleave` event is similar to `mouseout`, but differs in that does not bubble, and that it not dispatches until the pointing device has left the boundaries of the element and the boundaries of all of its children. An important feature of `mouseout`   triggers, when the pointer moves from parent to child. 
    2. `mouseenter` event is similar to `mouseover`, but differs in that it does not bubble, and not dispatches when the pointer device moves from an element onto the boundaries of one of its children elements.


### MouseEnterLeaveController.


```html
<style>
    #outer {
        height: 500px;
        width: 500px;
        background-color: yellow;
    }

    .pseudo_my_mouseenter {
        border: 2px solid green;
    }

    .pseudo_my_mouseleave {
        border: 2px solid red;
    }

    #inner1 {
        height: 300px;
        width: 300px;
        background-color: #21759b;
        position: relative;
        left: 100px;
        top: 100px;
    }

    #inner2 {
        height: 150px;
        width: 150px;
        background-color: #791329;
        position: relative;
        left: 75px;
        top: 75px;
    }


</style>

<div id="outer">
    <div id='inner1'>
        <div id='inner2'></div>
    </div>
</div>


<script>

  (function () {


      Object.defineProperties(HTMLDocument.prototype, {
          myMouseEnterElement: {
            get: function () {
              return this._myMouseEnterElement || this.body;
            },
            set: function (el) {
              this._myMouseEnterElement && this._myMouseEnterElement.classList.remove("pseudo_my_mouseleave", "pseudo_my_mouseenter");
              // this.myMouseEnterElement = el;
              el.classList.add("pseudo_my_mouseenter");
            }
          },
          myMouseLeaveElement: {
            get: function () {
              return this._myActiveElement || this.body;
            },
            set: function (el) {
              this._myActiveElement && this._myActiveElement.classList.remove("pseudo_my_mouseenter", "pseudo_my_mouseleave");
              // this._myActiveElement = el;
              el.classList.add("pseudo_my_mouseleave");
            }
          }
        }
      );


      //When mouse is located on inner HTML element when page finished to load we must to dispatch `mouseenter` event on target and ALL their parents till #document. We need to iterate it in reverse order so that is why we need this function and not iterate it directly inside controller.
      function getParentsNodes(element) {
        // push a target as first element.
        let arr = [element];
        while (element.parentNode) {
          element = element.parentNode;
          arr.unshift(element)
        }
        return arr;
      }

      // create event and define its `relatedTarget` property, it is unnecessary to define target, because we define event on particular node, so `target` attribute value adds automatically. But in some cases `relatedTarget` can be null (when we move mouse to alert() ao devtools
      function getEvent(name, target, relatedTarget) {
        let ev = new MouseEvent("my-mouse" + name);
        Object.defineProperty(ev, "relatedTarget", {
            value: relatedTarget ? relatedTarget : null
          }
        );
        return ev;
      }

      const MouseEnterLeaveController = {
        target: undefined,
        mousemove: function (e) {
          if (MouseEnterLeaveController.target && MouseEnterLeaveController.target !== e.target) {
            let mouseEnterEvent = getEvent("enter", e.target, MouseEnterLeaveController.target);
            let mouseLeaveEvent = getEvent("leave", MouseEnterLeaveController.target, e.target);

            //means that mouse moves towards child element. It can starts from <html>
            if (MouseEnterLeaveController.target.firstElementChild === e.target || MouseEnterLeaveController.target === document.documentElement) {
              document.myMouseEnterElement = e.target;
              e.target.dispatchEvent(mouseEnterEvent);

            }
            //means that mouse moves towards parent element
            else if (MouseEnterLeaveController.target.parentNode === e.target || getParentsNodes(e.target).length) {
              document.myMouseLeaveElement = e.target;
              MouseEnterLeaveController.target.dispatchEvent(mouseLeaveEvent);
            }
          }
            // hate this part of the code bu we must to implement this feature
          //  it must dispatch event on each element of the hierarchy,
          else if (!MouseEnterLeaveController.target) {
            for (let parent of getParentsNodes(e.target)) {
              let mouseEnterBubbleEvent = getEvent("enter", parent, undefined);
              parent.dispatchEvent(mouseEnterBubbleEvent)
            }
          }
          MouseEnterLeaveController.target = e.target;
        },

        mouseout: function (e) {
          //means that mouse is out of window
          if (!e.toElement) {
            let mouseLeaveEvent = new MouseEvent("my-mouseleave");
            setTimeout(() => {
              e.target.dispatchEvent(mouseLeaveEvent);
              MouseEnterLeaveController.target = null;
            }, 0)
          }
        }
      };


      window.addEventListener("mousemove", MouseEnterLeaveController.mousemove);
      // to detect whether mouse has been moved outside the window (to devtools for example)
      window.addEventListener("mouseout", MouseEnterLeaveController.mouseout);


      function log(type, target, relatedTarget) {
        console.log(type, "event:  cursor has been moved from ", relatedTarget, " to ", target);
      }

      function warn(type, target, relatedTarget) {
        console.warn(type, "event:  cursor has been moved from ", relatedTarget, " to ", target);
      }

      document.querySelector('#outer').addEventListener("mouseenter", e => log(e.type, e.target, e.relatedTarget));
      document.querySelector('#outer').addEventListener("mouseleave", e => log(e.type, e.target, e.relatedTarget));
      document.querySelector('#outer').addEventListener("my-mouseenter", e => warn(e.type, e.target, e.relatedTarget));
      document.querySelector('#outer').addEventListener("my-mouseleave", e => warn(e.type, e.target, e.relatedTarget));


      document.querySelector('#inner1').addEventListener("mouseenter", e => log(e.type, e.target, e.relatedTarget));
      document.querySelector('#inner1').addEventListener("mouseleave", e => log(e.type, e.target, e.relatedTarget));
      document.querySelector('#inner1').addEventListener("my-mouseenter", e => warn(e.type, e.target, e.relatedTarget));
      document.querySelector('#inner1').addEventListener("my-mouseleave", e => warn(e.type, e.target, e.relatedTarget));


      document.querySelector('#inner2').addEventListener("mouseenter", e => log(e.type, e.target, e.relatedTarget));
      document.querySelector('#inner2').addEventListener("mouseleave", e => log(e.type, e.target, e.relatedTarget));
      document.querySelector('#inner2').addEventListener("my-mouseenter", e => warn(e.type, e.target, e.relatedTarget));
      document.querySelector('#inner2').addEventListener("my-mouseleave", e => warn(e.type, e.target, e.relatedTarget));


      document.documentElement.addEventListener("mouseenter", e => log(e.type, e.target, e.relatedTarget));
      document.addEventListener("mouseenter", e => log(e.type, e.target, e.relatedTarget));

      document.documentElement.addEventListener("my-mouseenter", e => warn(e.type, e.target, e.relatedTarget));
      document.addEventListener("my-mouseenter", e => warn(e.type, e.target, e.relatedTarget));
      window.addEventListener("mouseleave", e => log(e.type, e.target, e.relatedTarget));
      window.addEventListener("my-mouseleave", e => log(e.type, e.target, e.relatedTarget));
    }

  )
  ();
</script>
```


the mouseenter mouseout events primarily does two things. it dispatches events, and it adds the :hover css pseudo class.
the difficult thing about mouseout and mouseenter is to calculate the hittarget for the mouse pointer. to do this, we need to
1) have the coordinates of the mousepointer which is easy, because we get those every time the mouse moves.
2) we need to look through the dom, bottom up, to find the element with the corresponding area that lies underneath the mousepointer. When we mirror this, we need to make several simplifications. We need to disregard z-index i think, and only look at tree order. when we do that, we search the DOM bottom-right first. The first hit target from bottom right that has a hit under the mousepointer, would be the hit target. When we disregard z-index and other. the algorithm for calculating hit target in the DOM needs research.
3) we would also need to evaluate if this calculation should be dynamic upon DOM mutations. if the DOM moves so it comes under the mousepointer, does :hover then update itself?
4) if the DOM element with :hover moves in the DOM away from the child element, should that remove the :hover pseudo-class? yes, i think it should. To accomplish this, all the :hover parents' parents must be observed using MutationObserver
this is it. The rest is learning about the sync non-sync timing of the mouseenter and mouseout and mouseover events. Do they dispatch sync after mousemove? mouseout before mouseenter? can we trigger them from script? probably not..
and adding the pseudo class. first, all the elements with the pseudo class removes the pseudoclass, then the hittarget, and all its ancestors are given a pseudo class.
3) no.. it is if the element changes its on screen location. if a script alters its or another elements style or DOM presence so the element moves. So we would have to check this after every layout. It would be a resizeObserver style callback. except that we would need not only the size, but the position. The simplest way to do this, would be to use a polling and checking the getClientBoundingRect manually.

