# WhatIs: DefaultAction

A `defaultAction` is a task performed by the browser. `defaultAction`s are **queued in the event loop**, and they are always **preceded by a native trigger event**. In this respect, DefaultActions very much resemble native cascade events.

DefaultActions are also **preventable**. If you call `preventDefault()` on the preceding trigger event, then the browser will not perform the browserAction (more on this in the next chapter). There are some rare exceptions to this rule, such as passive eventListeners that cannot prevent the default action of scrolling based on touch. We will discuss this in depth in the chapter on touch.

DefaultActions interact superficially with the DOM. DefaultActions can *read* data from the DOM associated with their triggering event, but they will not *alter* data in the DOM during their processing. Instead, DefaultActions use the data from the triggering event to perform some action in the underlying browser app. This makes them universal: they will invoke the same response on any web page. 

## Reproducable and irreplicable DefaultActions

Some DefaultActions can be reproduced from JS. For example, you can simulate a link `click` navigation from JS by giving the `location.href` property a new value. We call such DefaultActions **reproducable**.

Other DefaultActions are impossible to recreate from JS. For example, it is impossible to show the native context menu from script. The browser will *only* display the native context menu when the user initiates the request via a right-click, an touch-long-press, or another `isTrusted` user input event. We call such DefaultActions **irreplicable**.

## List of DefaultActions 

 * (click-link-to-)navigate,
 * (submit-to-)navigate, 
 * (wheel-to-scrollevent-that-eventually-will-)scroll, 
 * (pull-to-)refresh, 
 * (right-click-)contextmenu,
 * todo more??
 * `click => navigate`
   * the target of the `click` is a link.
    
 (todo verify this for all browser actions when we have a more complete list??)

## References

 * 
  
 ## Todo Research the Preventable/unstoppable nature of scroll events.

However, the default action of browsers is often associated with their own specialized event. Before the browser actually will scroll, it will dispatch a native, composed `scroll` event *after* the `touchmove` event and *before* the task of actually scrolling the viewport. The event order is touchmove (event) -> scroll (event) -> scroll (task). To call `preventDefault()` on the `scroll` event will cancel the scroll task. To call `preventDefault()` on the `touchmove` event will cancel the `scroll` event which in turn will cancel the scroll task.
 
