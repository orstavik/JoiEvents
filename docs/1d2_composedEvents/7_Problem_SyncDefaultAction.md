# Problem: SyncDefaultAction

`HTMLFormElement.requestSubmit()` is a native method that:
 1. validates the form,
 2. when valid, dispatches a future-tense submit event, and
 3. run the default action of the submit event which is to load a new page.
 
The problem with this method is that it will *both*:
* dispatch the event *sync*, and
* run the default action *sync*.

## Demo: NestedPropagation and SyncDefaultAction

In the demo below, we will see the nested propagation and sync default action cause the following problems:
1. The `submit` event **propagates nested** inside the `click` event. See the chapter Problem: NestedPropagation for a discussion of the problems with this.
2. The default action of the inner, nested `submit` event is run *sync* and therefore changes the state of the DOM/browser *before*:
   1. The `click` event listener from where `requestSubmit()` was called has finished. In the demo below this means that the statement `console.log("click 1 post dispatch");` is not run before the state change (ie. before the document is unloaded and thus cancelling the rest of the `click` event listener function).
   2. Any later event listeners for the upper, nesting `click` event. This means that the state changes of the default action of the submit event is run before the remaining event listeners of `click` has run, ie. before `console.log("click 2");`.
   3. Any microtasks queued before `requestSubmit()` is called from the nesting, upper `click` event listener. This might be easy to handle when the microtask is explicitly delayed using the explicit `Promise.resolve().then(()=>{...})` construct, but more difficult to manage if the microtask is stored in for example a framework or some other underlying resource. In the demo below, the default action of the inner `submit` event therefore runs before `console.log("click 1 (microtask from pre dispatch)");`. 
   4. Any microtasks queued from the nested, inner `submit` event. These microtasks are nearer to the default action, and thus easier to keep an overview over than the microtask in the `click` event, but they are still likely to cause confusion. In the demo below, this is the `console.log(" - microtask submit propagates");`

```html
<form>
  <input type="text" name="hello" value="dblclick anywhere to requestSubmit()">
  <button type="submit">async dispatch</button>
</form>
<script>
  //When the submit event is dispatched ASYNC, ie. the user click on the submit button,
  //all tasks, both (+) and (-), run *before* the default action of the submit event.
  //
  //When the submit event is dispatched SYNC, ie. from requestSubmit(),
  //then only the (+) tasks are run before the default action of the submit event,
  //and the (-) tasks are run after the default action of the submit event.

  // to see the (-) tasks run for the sync dispatched submit event, enable preventDefault() on the submit event.
  document.addEventListener("dblclick", function (e) {
    console.log("dblclick 1 (pre dispatch)");                                              //+
    Promise.resolve().then(() => console.log("dblclick 1 (microtask from pre dispatch)")); //-

    const form = document.querySelector("form");                                           //+
    form.requestSubmit();                                                                  //+

    debugger;                                                                              //-
    console.log("dblclick 1 post dispatch");                                               //-
  });

  window.addEventListener("dblclick", function (e) {
    debugger;                                                                              //-
    console.log("dblclick 2");                                                             //-
  });

  window.addEventListener("submit", function (e) {
    // e.preventDefault(); //disable loading new page and thus enable (-) tasks      
    console.log(" - submit propagates");                                                   //+
    Promise.resolve().then(() => {
      debugger;                                                                            //-
      console.log(" - microtask submit propagates");                                       //-
    });
  });
</script>
```

## Insult to injury: async submit events

You might think: "OK, fine! I just have to remember that `submit` events are dispatched sync, and that any microtasks run from it are lost, as are upper, nesting event listeners, and any statements after calls to `requestSubmit(...)`." But. I am sorry to say, that is not enough. 

The NestedPropagation and SyncDefaultAction of the `requestSubmit()` method is further complicated by the fact that `submit` events are *most often* dispatched **sync**. When `submit` events are initiated by a user-driven event such as a `click` on an `<input type="submit">`, both the `submit` event's event listeners and its default action are dispatched and run async. Therefore, when `click`ing on the submit button, all the (-) tasks in the demo below will run *before* the default action of the `submit` event (as you likely expected all the time).

## References