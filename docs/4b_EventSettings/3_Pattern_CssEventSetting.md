# Pattern: CssEventSettings

## Controlling native events from CSS

There are several examples of how CSS properties are used to control native events and gestures:
1. `cursor`: changes the icon of the mouse cursor when it hovers an element. This CSS property control the (visual) feedback for an event.
2. `pointer-events` and `touch-action`: enable the developer to control the propagation and actions of pointer and touch events. These properties control the behavior for an event. 
3. todo add more examples?? 

## Controlling custom events from CSS

Similarly can custom CSS properties be used to control custom, composed events and gestures. For example can the required duration for a `long-press` event be set on specific elements using a CSS variable: `--long-press-duration: 500ms`. 

The benefit of using CSS properties to specify such properties are many:
1. Because CSS custom properties cascade down the DOM, applying the same properties to many different elements and events is easy. 
2. Because CSS properties can override each other, it is easy to specify different properties for different elements. 
3. Because CSS rules can be turned on/off depending on DOM state (ie. CSS classes and HTML attributes), the event settings can declaratively be adapted to the state of the DOM.
4. Controlling behavior of events, gesture, and UX is tightly related with the overall design of the web app. Thus, controlling event settings from CSS makes it easier for designers to work with UX along side the visual estethics of the app.

But, there are two counterarguments against using CSS properties to control event settings:

1. CSS properties are syntactically limited. You can't write much as a CSS property value. Thus, CSS properties therefore mainly work for choosing between pre-existing template or specifying a numeric value of some kind.
 
   We can see this in how for example the `cursor` and `pointer-events` lets you *choose* between a set of fixed alternatives. We can also see this in how a `--long-press-duration` property can specify time. 

   But, we can also see how this can be problematic. What if you need to specify a more complex visual feedback than simply an image or sound? What if you wanted to specify a small piece of HTML template to provide a custom `cursor` during a `long-press` gesture? This is where CSS properties falls short. And we can see this in `content: "some text"` applied to `::before` pseudo-element. Such CSS properties feel both very *limited* (it only allows text content) and *messy* (conceptually, CSS comes *after* HTML template, and thus should not itself *add* HTML template to the DOM). This makes CSS properties a bad strategy if the developer wishes to for example add complex custom visual feedback or control event behavior granularly.

2. Even though designers might see events from the perspective of CSS, most developers view events from a JS perspective. They see the control of events as imperative operations done inside JS event listeners, not as declared states in CSS. This is of course neither true nor false. But it counters the argument that CSS, and not JS, is the "natural home" of event control.

## Issues implementing CssEventSettings

To read a CSS custom property from within a composed event gives us some concerns:

1. As CSS properties can cascade and override each other, we must find the *computed* value of the CSS property, not just the setting on the current element. To do so, we must use the costly `getComputedStyle(targetElement)`.

2. Composed events needs to be processed synchronously (cf. the PriorEvent and AfterthoughtEvent patterns). This means that we cannot for example postpone calling `getComputedStyle()` until the next `requestAnimationFrame()` in order to read event the settings from the CSSOM.

3. Instead, the CSS properties that control a native gesture is therefore only read *once* during each event sequnce. This same policy is applied natively too: for example are `pointer-events` and `touch-action` read only once at the touch or mouse gesture's initial event and then fixed until the gesture ends(; todo check if this applies to `cursor` too). The consequence of this is that CSS properties cannot be used to control an event *in-flight*. For example, if you set `touch-action: none` from within a `touchstart` event listener, it will still scroll and pan or whatever until the gesture already started has ended.

4. If you need to read more than one CSS setting, you read them all at once in order to avoid re-calculating the CSSOM more than once and in order to avoid strange race-conditions.

5. For a few simple combinations of event sequences and event settings, it is possible to read the CSS property at the end of the event sequence, and not up front. However, this can cause confusion as most event settings are read up front. My advice in such scenarios is:

   If you can delay calling `getComputedStyle()` until a later point, I recommend that you do so. But, at the same time you should expect other event settings appearing later that will force you to move calling `getComputedStyle()` up front again. If you by that time have made code that for example alters the CSS event settings *after* the gesture/event sequence has been initialized, your code will break. Thus, always expect CSS event settings to be read up front, and it is for that reason not wrong to always do so.
 
## Demo: `--long-press-duration`

In this demo we will control the time a user has to press on an element with a mouse for a naive `long-press` event to occur using a custom CSS property `--long-press-duration`. The `--long-press-duration` is expressed as either `ms` or `s`. A negative value will turn `long-press` off.

<pretty-printer href="./demo/long-press-settings-css.js"></pretty-printer>

<code-demo src="./demo/long-press-settings-css.html"></code-demo>

```javascript
(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;
  var duration;

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    duration = getComputedStyle():
    window.addEventListener("mouseup", onMouseup);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    var longPressDurationSetting =                          //[1]
      e.target.getAttribute("long-press-duration") ||
      document.children[0].getAttribute("long-press-duration") ||
      300;
    //trigger long-press iff the press duration is more than the long-press-duration EventSetting
    if (duration > longPressDurationSetting){
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    window.removeEventListener("mouseup", onMouseup);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();
//1. The `long-press-duration` EventSetting is grabbed once,
//   when first needed, and then reused.

```

## References
