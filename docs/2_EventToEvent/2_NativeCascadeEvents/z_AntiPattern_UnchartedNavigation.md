# Anti-pattern: UnchartedNavigation

When you `click` on a `<a href>` element (here: "link"), you "navigate" to the location the link reference. Easy as pie. And the EventCascade of navigation is just as simple: `click => "navigate"`. To block the navigation task is also simple: call `.preventDefault()` on the `click` event, and the `"navigation"` task is cancelled. Piece of cake.

## Demo: LinkNavigation

```html 
<ul>
  <li><a id="one" href="#sunshine">free</a></li>
  <li><a id="two" href="#darkSideOfTheMoon">prevented</a></li>
</div>

<script>
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase);
  }

  function preventD(e) {
    console.log("calling: " + e.type + ".preventDefault()");
    e.preventDefault();
  }

  two.addEventListener("click", preventD);  //#two.preventDefault() 

  one.addEventListener("click", log, true);
  two.addEventListener("click", log);
  one.addEventListener("click", log);
</script>
```                      

## Problem: ClientSide routing

If all you want is the browser's default navigation (pie) and the ability to stop it (cake), then `click => "navigate"` is enough. But. What if you want more control? What if you want to re-route some navigation requests, but not others? What if you want to whitelist or blacklist navigation? What if you wanted some kind of custom, client-side routing? 

In more complex use-cases, the minimalist `click => "navigate"` EventCascade is problematic:

1. `click` events that trigger `"navigation"` must be distinguished from all the other `click` events. In principle, this should be simple: `<a href>` elements are not allowed to contain other "clickable" elements, and therefore all `click` that hit an `<a href>` element should trigger `"navigation"`. But, in reality, it is not so simple: browsers accept HTML documents that flout this rule. For example Chrome renders `<a href="#sometimesTriggered">Hello<input type="checkbox"></a>` just fine. Here, if you click on the checkbox, the browser will flip the checkbox value, but *not* trigger the link's `"navigation"`. But if you click on "Hello", `"navigation"` will be triggered. Thus, identifying 

2. after `click => "navigate"` EventCascades are identified, work must be done to calculate the complete Url from the partial `href` attribute of the `<a>` element. This is a small, simple, universal task, but a task nonetheless.

## Solution part 1: The SubsetEvent pattern 

The *first* problem of separating `click => "navigate"` EventCascades from all the other `click => "something-else"` EventCascades, is essentially a problem of identifying and marking a *subset* of `click` initiated EventCascades. The solution to this problem is a pattern we can call SubsetEvent.

The SubsetEvent pattern first *identifies* a subset of the EventCascades by analyzing the trigger events, and then *marks* the relevant EventCascades by inserting a new event into these EventCascades. The exact position of this inserted CascadeEvent may vary, but the guiding principle is to place it:
 * *immediately after* the trigger event(s) that needs to be analyzed, and
 * *before* any state-changing defaultActions. 
 
Thus, in the case of link `click => "navigation"`, we need to insert a `before-navigate` *after* the `click` event, but *before* the `"navigation"` defaultAction:
 
    click => before-navigate => "navigate"

But, when it comes to EventCascades, the browser is a bit over-eager: it queues all the tasks in the EventCascade in event loop *up front*. This means that the `"navigate"`-defaultAction task is scheduled *before* the `click` event begins its propagation. And this means that to insert a CascadeEvent *after* `click` and *before* any navigation by the browser, we must cancel the queued `"navigate"`-defaultAction task. In sum, we must therefore:
1. cancel the original `"navigate"`-defaultAction by calling `click.preventDefault()`, and
2. add a task dispatching a `before-navigate` event immediately after the `click` event in the event loop, and
3. then add an imitation of the `"navigate"`-defaultAction immediately after the `before-navigate` event in the event loop. And here the browser's over-eagerness seem justified, because the simplest means to ensure that our `"navigate"`-defaultAction immitation also will run immediately after the `before-navigate` event is to *queue them both up front*. 

## Solution part 2: Identify link `click`s

> Put simply, interactive elements are elements that will have a native reaction when `click`ed.

Links are interactive elements, and links should not contain other interactive elements (including other links) according to the spec. This rule prevent `click` confusion: 
 * Premise 1: Links should react to a `click` on it and inside it.
 * Premise 2: Links cannot house other interactive elements that also should react to `click`. 
 * Consequence: No `click` event will ever contain another interactive, "clickable" element below a link in its target chain. 
 * Consequence: If a `click` event contains a link, then that link must be the lowest interactive, "clickable" element in the target chain and therefore also *must be* the most relevant target of the `click`.
 
This spec sounds fine in theory. In reality, however, browsers don't follow this rule. They follow another rule. Not written down anywhere. Browsers often *do* render other interactive elements inside links. And, when they do, they follow a rule that when two or more interactive elements appear in the *only* the innermost "clickable" element should react to `click` events. cannot  regarding  reactions. This means that if an element is links are not allowed to contain clickable, . But the browser likely still renders them. And the browser does not trigger `"navigation"` if the   If the `click` event's target chain contains an *below* the link, this is not allowed according to the spec. But, if the browser allows such an element, then we can assume that then the `click` affects that other element, *not* the link. But, which elements are "clickable"?  

a (if the href attribute is present)audio (if the controls attribute is present)buttondetailsembediframeimg (if the usemap attribute is present)input (if the type attribute is not in the Hidden state)labelobject (if the usemap attribute is present)selecttextareavideo (if the controls attribute is present)
The tabindex attribute can also make any element into interactive content.

## Solution part 3: Imitate native "navigation" and `<img ismap>`

Basically, the native `"navigate"`-defaultAction in the `link.click => "navigate"` EventCascade is made up of two steps:
1. The browser computes a "destination url" from the link, and
2. the browser sets `location.href` to be the "destination url".

In 99.9999% of the times, the destination is merely a product of the `link.href` and `link.baseURI` properties: `location.href = new URL(link.href, link.baseURI);`.
But. *One* edge case exists. If the `<a href>` is wrapped around an **`<img ismap>`** element, then a `?x,y` suffix representing the coordinates of the pointer over the image at the time of the `click` is added to the "destination url". And, in order to identify `<img ismap>` `click` and the pointer's position over the imagemap, we need also to access the `click` event when we compute the destination url.

To full imitation of the defaultAction in `link.click => "navigate"` is:   

```javascript
function computeLinkDestination(linkElement, clickEvent){
  const href = (clickEvent.target.nodeName === "IMG" && clickEvent.target.hasAttribute("ismap"))?
    linkElement.href + "?" + clickEvent.offsetX + "," + clickEvent.offsetY :
    linkElement.href.animVal || linkElement.href;
  return new URL(href, linkElement.baseURI);
}

location.href = computeLinkDestination(linkElement, clickEvent);
```


## References

 * [Whatwg: interactive elements](https://html.spec.whatwg.org/multipage/dom.html#interactive-content-2)
 * [Whatwg: `<a>` must not contain interactive elements](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)

2. `<svg>` documents also contain `<a href>` elements, and their `href` property is an object containing the both the current and original href string. The current `href` value of svg-`<a href>` elements is `link.href.animVal`.


## HowTo: Implement a SubsetEvent

likely  as soon as the EventCascade 
When we need to distinguish all the  from all the other s that will navigate from all the other `click`s, the pattern is to  specific type of event from other  

## Problem 2: 
 
   This makes a safe algorithm for separating `click => "navigate"` EventCascades a bit more cumbersome. The algorithm is still universal, the same function can be applied to idenfify all to `click => "navigate"` situations.  `click`ed children , and thus scripts that intend to distinguish `click` for navigation needs to be able to handle such scenario , and


; in practice however, 

## Anti-pattern: `.preventDefault()` as "ctrl+z"

There is a big issue with the EventCascade and use of `.preventDefault()` of native checkboxes.

Imagine the following situation:
1. The user `click`s on a checkbox.
2. This action will change the value of the checkbox (if not prevented).
3. But, a script needs to prevent this change in some circumstances. The script therefore adds an event listener on the checkbox for `click` events, and then calls `.preventDefault()` on this `click` event.
 * This idea is fine. You can `click` on a checkbox to change its value. If you need to prevent this change, you simply call `.preventDefault()` on the `click` event. 

But. There is a problem: **the browser changes the value of the checkbox *before* the `click` event is dispatched**. The checkbox you see on screen and the value of its `.checked` property you read from JS has *already changed* when the `click` event is dispatched.

![EventCascade for native checkbox preventDefault](sketches/native_checkbox_eventcascade.jpg)

To get the `click.preventDefault()` to produce the expected result, the `click.preventDefault()` method cannot simply *cancel* a queued action not yet done. Instead, `click.preventDefault()` must when applied to a checkbox *add* a *second* task that will *undo the changes of the checkbox that has already been implemented*. Ie. `click.preventDefault()` adds an "additional ctrl+z task" when checkboxes are clicked. 

Furthermore, the state of a checkbox should be considered unsafe during *any* `click` event listener that might be triggered when a checkbox is clicked:
1. As `.preventDefault()` might be called at any time during a `click` event propagation,  the state of the checkbox after the `click` event might not be known. Fortunately, this is a solved problem. The `change` event is dispatched *after* the `click` event has propagated (ie. when `.preventDefault()` is not called). The `change` event thus gives the developer easy access to situations when checkbox values "has-changed".
2. To read the state of the checkbox *before* the EventCascade began, a `click` event listener on a parent element above a checkbox *must* first a) check to see if the checkbox is the target element of the `click` event, and then b) use the inverse value of the `checked` property as the *before* value for the checkbox. Not pretty.

## Demo: CheckboxCtrlZ

```html 
<div>
  <input type="checkbox">
</div>

<script>
  const div = document.querySelector("div");
  const check = document.querySelector("input");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase, "checkbox is " + (check.checked ? "filled" : "empty"));
  }

  function preventD(e) {
    console.log("calling: " + e.type + ".preventDefault()");
    e.preventDefault();
  }

  div.addEventListener("mouseup", log, true);
  check.addEventListener("mouseup", log);
  div.addEventListener("mouseup", log);

  window.addEventListener("click", preventD, true);  //preventDefault() called first on the click event

  div.addEventListener("click", log, true);
  check.addEventListener("click", log);
  div.addEventListener("click", log);

  div.addEventListener("change", log, true);
  check.addEventListener("change", log);
  div.addEventListener("change", log);

</script>
```

## How *should* the EventCascade for checkboxes be?

The CheckboxCtrlZ problem is caused by a simple error of sequence in the EventCascade:
 1. the task that alters the state and shadowDOM of the checkbox is executed *before*
 2. the `click` event propagation, while the `click.preventDefault()` method is the designated controller of the state-altering task.   

There are two ways to fix this:
1. move the state-altering task *after* the dispatch of the `click` event, or
2. move the control of the state-altering task to the `.preventDefault()` of an *earlier* event, such as `mouseup`.

Alternative 1 is better. In most other situations, the browser changes state *after* the `click` event has propagated. For example, the browser doesn't navigate to a new page *before*  the `click` on a link has propagated. Moving the state-altering task for checkboxes post `click` propagation thus would fit with other EventCascades that involve `click`. Furthermore, `click.preventDefault()` is an intuitive control for checkbox `click`s. It is the `click` action that alters the checkbox, not a `mouseup` for example.
 
A "corrected" EventCascade for checkbox `click`s would therefore be:

    mouseup => click => "state-change" => change

where calling `click.preventDefault()` would essentially cancel the two ensuing tasks: the "state-change" task and the `change` event propagation task. 

![EventCascade for "corrected" checkbox preventDefault](sketches/native_checkbox_eventcascade.jpg)

## Demo: CheckboxChangeCorrected

```html 
<script>
  class CorrectedCheckbox extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `<div style="border: 2px solid grey; width: 1em; height: 1em;"></div>`;

      this.checked = false;
      this.addEventListener("click", this.onClick.bind(this));
    }

    onClick(e) {
      if (e.defaultPrevented)
        return;
      e.preventDefault(); //cancel any other side-effect from click
      const taskId = setTimeout(this.doChangeAndDispatchHasChangedEvent.bind(this), 0);
      e.preventDefault = function () {
        clearTimeout(taskId);
      }
    }

    doChangeAndDispatchHasChangedEvent() {
      this.checked = !this.checked;
      this.shadowRoot.children[0].innerText = this.checked ? "v" : "";
      this.dispatchEvent(new CustomEvent("has-changed", {composed: true, bubbles: true}));
    }
  }

  customElements.define("corrected-checkbox", CorrectedCheckbox);
</script>


<div>
  <corrected-checkbox></corrected-checkbox>
</div>

<script>
  const div = document.querySelector("div");
  const check = document.querySelector("corrected-checkbox");

  function log(e) {
    console.log(e.type, e.currentTarget.tagName, e.eventPhase, "checkbox is " + (check.checked ? "filled" : "empty"));
  }

  div.addEventListener("mouseup", log, true);
  check.addEventListener("mouseup", log);
  div.addEventListener("mouseup", log);

  div.addEventListener("click", log, true);
  check.addEventListener("click", log);
  div.addEventListener("click", log);

  div.addEventListener("has-changed", log, true);
  check.addEventListener("has-changed", log);
  div.addEventListener("has-changed", log);

  function preventD(e) {
    console.log("calling: click.preventDefault()");
    e.preventDefault();
  }
  /*
   * Call click.preventDefault() by uncommenting on of the lines below.
   * It makes no difference if you call .preventDefault() at
   * the beginning, middle or end of the event propagation cycle.
   */
  // window.addEventListener("click", preventD, true);    //the beginning of the capture phase of propagation
  // check.addEventListener("click", preventD);           //the target phase of propagation
  // window.addEventListener("click", preventD);          //the end of the bubble phase of propagation
</script>
```

## Why `change` is "after-change" for checkboxes?

The `change` event is always executed *after* a) the state-altering task has been performed and b) can no longer be prevented. This means that the `change` event should be read as "has-changed" event, NOT as a "will-change". Furthermore, as the state change "has-changed", you should NOT expect `change.preventDefault()` to be able to prevent state change neither. But why? Why make `change` a "has-changed" event and not a "will-change" event?

The reason is that the `click` event is the "will-change" event for checkboxes. Checkboxes cannot have any children element. Therefore, if a `click` event propagates to/through a checkbox, then it is a 100% certain that it was the checkbox that was `click`ed. So, if you listen for `click` events on a checkbox, you can be sure that this event listener and this `click` event is a "will-change" reaction.

However, if checkboxes could contain child elements that also reacted to `click`s, the situation would be different. In such a scenario, adding a `click` event listener on a checkbox would not be enough to exclusively identify "will-change" events for the checkboxes, but the event listener would also be required to verify that the target of the `click` was the checkbox itself or one of its "unclickable children", and not one of its "clickable children". Such boilerplate checks for (is this my `click` or a `click` meant for one of my children?) are both a) easy to get wrong, b) forget, and c) universal, and therefore in such instances it is better that the platform adds another "beforechange" type of event that will propagate *after* the `click` and *before* the state-change is done.

So, for elements that cannot have interactive child elements, adding event listeners directly to the element is enough to distinguish between different exclusive use-cases. Events on such elements can cope with a much simpler EventCascade (ie. `click` => stateChange => `change` suffices). But. For elements that can house interactive child elements, the a more detailed EventCascade is helpful as it avoids misunderstanding and event listener boilerplate (ie. `click` => `before-change` => stateChange => `after-change` is preferable).

## References:

 * 