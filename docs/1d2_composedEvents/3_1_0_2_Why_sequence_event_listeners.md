# Why: sequence event listeners?

The premises for this discussion are:
1. The existing algorithm for prioritizing and sequencing event listeners for events we call "sequencing-of-event-listeners-for-composed-true-and-false-events", or just "composed sequencing" for short.
2. Composed sequencing switches between different `Document` contexts *often*. Event listeners from one `Document` can be called both *before* and *after* event listeners from another `Document`, and vice versa. In very complex, hard to read patterns. 

## WhyAndHow: do the sequence of event listeners matter?

Often it does **NOT** matter if one event listener runs *before* or *after* another event listener: the event listener performs a function (that do state changes) that do not change the premises for the other event listener, *and vice versa*. For such event listener pairs, the sequence of event listeners doesn't matter.

However! Many other event listeners **do** influence each other, directly or indirectly. These event listeners change *some kind of state* that *should* influence *how* another event listener function. Here, the sequence of event listeners is *extremely important*, and if the sequence between such event listeners are somehow wrong, then that will essentially invert the result of the event listener as a pair (yes, it is the event equivalent of `+` becoming `-` in a mathematical expression). 

So. Event listener sequence matter *a lot* when one event listener change state that is the premise of another event listener. So, *why* do one event listener need to change the state/premise behind another? And *how*?

## WhyAndHow: one event listener affect another event listener?

The reasons *why* one event listener needs to influence another event listener is really infinite. The interplay between event listeners are tightly associated with the functionality of the app. Or the particular behavior of a specific web component. Thus, "the why" is really not helpful as a starting point for understanding event listener interaction (and thus sequencing).

However, the mechanisms for *how* one event listener *do* influence another event listener are *finite* and very helpful for understanding event listener interaction (and sequencing). An event listener can:
1. **change state** that another event listener/default action depends upon/reads during their execution.
2. **stop/prevent** another event listener/default action from *being invoked*.

**Note!!** In this dicussion I will recast `defaultAction`s as "event listeners". I stand by choice 100%. `defaultAction`s are just a special set of event listeners, both technically and conceptually. And approaching them as such helps clarify the needs for how event listeners *should* be able to control each other, and thus *what event sequence **truly is needed** in the DOM*. 

## HowTo: change the state for another event listener?  

When a normal event listener runs, it can change a state another normal event listener uses:
 * one event listener **writes** to a state, and another event listener **reads**; and
 * the state can be the DOM (for example adding an attribute, or removing an element) and/or just changing the property of a JS object that both event listeners have access to.
   
A normal event listener can also *change state* that another defaultAction uses/reads. For example, if a `click` event listener adds, removes, or mutates the `href` attribute of an `<a>` element that is triggered by that `click`, then this state change *will* influence the default navigation action of that `<a>` element.

If you change the state of *one element in the DOM*, then this is a *good* mechanism for controlling a) default actions associated with that element or b) event listeners associated with that element's shadowDOM.

Any other state changes in the DOM should *only* influence *subsequent* event listeners within the same `Document`. 

## HowTo: stop/prevent another event listener?

Normal event listeners can **stop** other event listeners from being invoked by calling `stopPropagation()` and `stopImmediatePropagation()` on an ongoing event. This will stop any **subsequent** event listeners either from the next propagation target, or from the same propagation target.

`stopPropagation()` and `stopImmediatePropagation()` *should* only influence event listeners in the same `Document`. However, `stopPropagation()` runs the board and blocks everything in its path. This is hugely problematic and essentially means that `stopPropagation()` should not be used with web components in its current form. 

Event listeners can also **prevent** default actions from being invoked by calling `preventDefault()` on the event. `preventDefault()` will cancel *preventable* defaultActions for the event.

Furthermore, if *one* preventable default action has run, this preventable action will stop all other preventable default actions from being invoked on the same event. It is as if the *first* default action calls `preventDefault()` on the event which in turn will block the invocation of any other **subsequent** preventable actions.

The reason *why* only one preventable action runs, is that the current native elements only include preventable actions that are user-attention-grabbing-actions. There is nothing principly wrong with having multiple preventable actions run for one event. However, if the browser does *two* user-attention-grabbing-actions at the same time, this most commonly will cause a conflict of attention for the user, and thus by default, when only user-attention-grabbing-actions are listed as preventable, then the default rule should be to let only one such action run. (later we will upgrade this rule, but for now it can stand).

While `stopPropagation()` *should* work only on event listeners within the *same* `Document`, `preventDefault()` *do* only work for event listeners associated with the inner workings of another element/subsequent `Document`, and *should not* influence any other event listener in the same `Document`.  

## Rule #1: UseR controls useD

The first rule for which event listeners should come first is based on the *sequentiality* of `Document` construction and use.

When an HTML `Document` (A) *uses* a web component (ie. another HTML `Document` B), then there are two important *facts of life*:
1. When writing the "user document" A, the developer *must know* that used `Document` is used. For example, developer A might statically `import` the code from developer B, or `Document` A might have a script that dynamically adds/removes web component B. In either case, A *can* know about B in particular, and *can* make particular adjustments. 
   
2. Web component/`Document` B can be (re)used in a million different other HTML `Document`s. Therefore B cannot not make any assumptions about its context of use inside A particularly, it can only make assumptions about its context of use in general (it should only make rules for how it should be used in general, as if the web component was a pure function; it should not rules for how it should be used in the case of `Document` A in particular, as if the web component was a method of `Document` A).

3. This means that any *particular* coordination/adaption of functionality between the *two* `Document`s must happen **from user to used** `Document`. This principle can be seen in how web components manage HTML and CSS too: it is the useR `Document` that direct the useD `Document` HTML and CSS, not vice versa. And so it must be with event listeners too: **the useR `Document`'s event listeners must run before the  useD `Document`'s event listeners**, so that the useR `Document` can modify and/or stop the useD `Document` reactions *when needed*.
                                                                 
## Rule #2: target before slot

However, web components can be composed in *two* different ways:
1. as content within host nodes, and
2. as slotted content.

We can see this sequencing conflict in action with an example using two native elements:
```html
<a href="https://example.com">Hello sunshine <input type="checkbox"></a>
```

If you `click` on the `<input type="checkbox">`, then the `click` event can trigger the default action of both `<a href>` and `<input type="checkbox">`. However, it is clear from the context that when the user points and aims at the "innermost" checkbox, he/she wants the action of the checkbox, not the link, if the machine must choose between the two.

We premise the discussion that:
1. the defaultActions are preventable event listeners, and 
2. that when one preventable defaultAction runs, it effectively calls `e.preventDefault()` and stop subsequent defaultActions (if not otherwise specified by an event listener with higher priority). 
   
With these two premises, it becomes clear that the event listeners/defaultActions in the shadowDOM of the `target` elements **must** run *before* the event listeners/defaultActions in the shadowDOM of the slotted elements.  
                              
## Rule #3: lowest-SlotHost-Wins

But, what happens when the elements with "SlottedShadowDOM" are nested inside each other? We can see this conflict in the following example with native elements:
```html
<details>
  <summary>Hello <a href="https://example.com">sunshine</a></summary>
</details>
```

If the user `click`s on "sunshine", the `<a href>` slotting element is "nearer" the innermost target that the user aims and points at than the `<summary>` slotting element. This means that if the browser is forced to choose between the default action of the two slotting elements, it should choose the actions of the lowest SlotShadowDOM host-node element: here `<a href>`. 

This means that the event listeners in slotted documents should run lowest-slotHost-first.

## Rule #4: outer SlotMatroska control inner SlotMatroska

To add insult to complex injury, web component can itself nest its inner `<slot>` element inside another web component. This we call a SlotMatroska. And can be terribly complex to envisage.

However, in the case of event control the needs of the SlotMatroska is simple. The outermost `Document` that uses another slotting element will follow the same rule #1 as useR controls useD `Document`. The event listener in the outer SlotMatroska ShadowDom should therefore come *before* the event listener in the inner SlotMatroska ShadowDOM so that the useR can control the useD `Document`. Recursively.

## Rule #5: feedback from lower default action runs via event loop

Finally, we have the question whether or not event listener in the useR `Document` should be able to *react* to event listeners being run in the useD `Document`. And, if this should happen via event listeners in the useR `Document` reacting to such state changes during the propagation of the same event? 

The answer to those two questions are: 1) yes, 2) no. Why?

First. The useR `Document` should be given feedback about state changes that is relevant to it. And the `Document` should react to those state changes using event listeners. Fine. 

But. The way that native elements traditionally has handled this state change feedback has by indirectly triggering the dispatch of other events that are associated with the state change being made: `toggle` event from `<details>` and `hashchange` from `<a href>`. There is no event listener for the same event again *after* the default action.

So. Yes, useR `Document`s need a back channel from the useD `Document`s. But. No, useD `Document`s do not *need* to do this, nor *should* they do this, via the same event propagation. Instead. State changes that useD `Document`s need to alert their useR `Document` about should *always* occur as separate events, dispatched either sync or async via the event loop.

## The Five thumb rule of event listener sequence

All event listeners should be sequenced:

1. useR before useD `Document`s
2. target before slot `Document`s
3. lowest slotting `Document` first
4. The outer SlotMatroska is useR of useD, inner SlotMatroska
5. feedback from useD `Document`s state changes are notified via separate events.

This is the Bounced sequence of event listeners.

## HowTo: control `composed` sequence?

Can event listeners be fully controlled when they follow `composed` sequence? 

tldr: no.
          
In order to get event listeners in a `composed` sequence to comply to the needs addressed above, we would need to implement a series of "soft rules" across *all* HTML `Document`s in an app. These additional soft rules would be difficult to implement, and impossible to enforce. However, it is good to see them lined up so as to more readily see the consequence for state change chaos when these soft rules are broken. 

### Soft rule 1: target=capture,slot=bubble

All event listeners to elements that has a `<slot>` descendant in their `Document` be `capture: false` and all event listeners that do not have a `<slot>` descendant be `capture: true`. The overall effect of this rule would be to:

1. force all hostNodeTargets to primarily run top-down in the capture phase, and
2. then have all the event listeners in the slotted ShadowDOM contexts run bottom-up, as required by five thumb rule 1 and 2.

The egg broken/use case deemed impossible by this rule is listening for non-bubbling events inside a slotted ShadowDOM context.

### Soft rule 2: move slot ancestor down onto slot 
   
To ensure that the useR slotting `Document` runs before the useD slotting `Document` in a SlotMatroska, all event listeners to an ancestor to a `<slot>` element within the same `Document` should be moved *down* onto the `<slot>` element itself. Only from the `<slot>` element itself will the useR slotting `Document` be able to control the useD slotting `Document`.

However, this rule do *not* apply to siblings and other nodes that is not an ancestor of a `<slot>`, even though they are in the same document.

The egg broken/use case deemed impossible by this rule is that using a "frame" around a slotted element as a `click` target for example is not possible without doing some kind of hacky layout manipulation of the `<slot>` element itself.


## Why: different `Document`s?

Or, more precisely, why web components? Well, the raison d'être for web components is: a) reuseability and b) modularity. In other words, one developer should be able to create a web component in isolation, and have that web component also work in the context of another web `Document` (inside an `.html` file or inside the shadowDOM of another web component).

To be able to write web components in isolation: the html elements of the web component is separated in a ShadowDOM, the CSS of the web component is separated from the rest of the CSS in the application, and the web component has its own class and some callback functions that enable it to stay apart from the rest of the JS application.

To be able to interact with other web components: the ShadowDOM is connected to other DOMs via the hostNode and `<slot>` elements; CSS (custom) properties can be inherited along the hostNode and `<slot>` elements; and JS methods can be called more or less freely across web component borders.

For events, the `composed: false` enable the developer to keep events inside one `Document`; `composed: true` enable the developers to share an event across `Document` borders.

## HowTo: isolate event control?

However, `composed: true` is a *bad* way to share an event between different DOM contexts that should be written in isolation. Why?

`composed: true` sorts the propagation sequence in event phase first, then `Document`. In the simple example with the `<check-box>` element, this might not be too bad: *first* the main document receives the event relay baton (in the capture phase, *second* the shadowDOM gets event relay baton, *finally* main document receives the event relay baton (bubble phase).

But, the more web components are involved, the more complex things get: if the main document had placed the `<check-box>` inside a `<details><summary>` for example, you would now have the following event relay baton: 1. main capture, 2. details shadow capture, 3. main capture (summary element), 4. summary shadow capture, 5. main capture/at-target (`<check-box>` element), 6. `<check-box>` shadow capture-bubble, 7. main bubble/at-target (`<check-box>` element), 8. summary shadow bubble, 9. main bubble (summary element), 10. details shadow bubble, 11. main bubble. If every document was written by a different developer, this would be four different developers exchanging one event ten(!) times.

Why are these exchanges a problem? Are they not only a technicality? No. Every time a developer gets the event he gets the control to do state changes. He can for example call `stopPropagation()`, `preventDefault()`, change a property inside his own document, read a property on another element (that can also be changed from inside the element), etc. etc. Especially when the event passes in and out of slotted shadowDOM context, developers don't consider that such state changes might have occured between one event listener and another inside his own `Document`. Therefore, you don't want to pass the same event in and out of different documents that many times, you want one developer to finish his part of the race before handing the control over to the next developer, and so forth. (Imagine how exciting and chaotic a 4x100m relay sprint would be if the runners had to pass the baton between them 10 times, instead of 3, per run.)

The `eventPhase` property plays no such role. Work isn't isolated based on `eventPhase`, work is isolated based on `Document`s (web components, html files, etc.). Thus, it doesn't have any negative consequence of moving `eventPhase` down a peg and prioritize event propagation on `Document` order *first*.


## References

*
