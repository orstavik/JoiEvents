# HowTo: categorize events?

## External events

External events represent **a state change of data outside of the DOM**. For example, a `keydown` event represents a state change of the user's finger, a change of the mouse buttons position, a primitive UI event in the OS; the `offline` event represents a state change in a cut network cable, a router loosing power, the OS loosing wifi connection. The event is a "sign of a state change", and external events represents state changes external to the DOM. 

External events can be relevant for any element anywhere in the DOM. And therefore, they should be accessible to all DOM layers. For example, a `click` is an external event that can be directed at elements in both the main *and* shadowDOM contexts. In an app, a `click` can `target` both a play button in the shadowDOM of a `<video>` element or a regular button in the main DOM. Another example is the `resize` event. When the `window` `resize`s, a reaction might be triggered that both control the layout of the control panel inside a `<video>` element or the content of the footer at the bottom of the main document. Therefore, the external `click` event needs to be accessible in all DOM contexts.

## Internal events

Internal events represent **a state change of data internalized in the DOM itself**. The DOM consists of a series of elements and nodes, and many events are dispatched that alert of a change of a state of one such element and/or one of its properties. Examples of internal events are:
1. `change`: the value of an input element *has been* changed. The `change` event are sometimes dispatched only when the input element looses focus. The `change` event represent a state change of an input element.
2. `reset`: the `value` property (or equivalent) of potentially several input elements in a `<form>` *will be* changed. The `reset` event represent a state change internal to a group of elements clustered under a single `<form>` element *all within the same DOM context*.
3. `toggle`: the `open` property of a `<details>` element *has been* changed. 

## Past-tense and future-tense events

Both internal and external events can announce state changes that *has already occurred* or that *will occur*. For example `contextmenu` is dispatched *before* the browser will show its native context menu over an element, and a `change` event is dispatched *after* an input element has changed its state.

 * **Future-tense events** announce a future, coming state change. 
 * **Past-tense events** announce a past, completed state change.
 
An event should not be dispatched *during* an ongoing event change. The event should either pass before the state change begins or after the state change is completed. If you need to announce the state of an ongoing event, such as with `scroll` or `mousemove`, you announce several events that all unequivocally depict a *completed state change* that is part of a series of such state changes. Try to prefix and postfix events alerting about state changes with start- and end-events, such as in `compositionstart`, `compositionupdate`, and `compositionend`.   
 
Many *future*-tense events represent both a past state change and a possible future state change. For example, a `click` can alert about a past state that has already occurred (a `mousedown` and `mouseup` over an `<button type="submit">`) and a future, coming state change (the dispatch of a `submit` event). Even the `submit` event also alerts about both past and future state changes: that a `<form>` elements submit function has been requested (either via `requestSubmit()` or via a `click` on a submit button) and that the `<form>`'s `submit()` method is about to be triggered.

If an event announce *both* a past *and* a future state change, the event should be considered **a future-tense event** first and foremost. Only if an event has *no* associated, default state change in any element should it be considered a past-tense event first and foremost. Remember that scripts and web components can add actions to native past-tense events, which would make them future-tense in the context of that app.

## How to group events?    

It is good practice to have *one type of future state changes* be exclusively associated with *one future-tense event*. The `submit` and `contextmenu` events are good examples of such behavior.

It is bad practice to have *many different state changes** be associated with *the same future-tense event*. For example, the `click` event heralds a great many different state changing actions (such as opening a `<details>` element, toggling a checkbox, or navigating to a new page). Furthermore, it might be difficult to assess which of these different state changes a specific `click` triggers/what state change is stopped when you call `.preventDefault()` on a `click` event.

Striking the balance between `submit` and `click` can be tricky. On the one hand, if every action gets its own heralding event, then the event namespace would quickly swamp and overwhelm the developer. On the other hand, if all actions are heralded under the same (event) name, then knowing what event is which action when can be very confusing.

A native example of a compromise is the `beforeinput` event. The `beforeinput` event announces one of a) a series of a similar, but not identical state changing actions on b) a series of related, but still different elements: `<input>`, `<select>`, and `<textarea>`. The `beforeinput` compromise works, and we can see why when it to `click`:

1. The state changing actions of the `beforeinput` event are quite similar. In many use-cases you would perform the same action if the `before-state-change` event were dispatched on a `<textarea>` or an `<input type="radio">`. This is a benefit for `beforeinput`: it both reduces the number of event names developers need to remember, and it provides a useful common hook to react to similar use-cases from. (To put it in reverse, if `beforeinput` event were broken into different types depending on what type of input element were changed, then most often you would simply add multiple event listeners for all these types in places were you today only have one `beforeinput` event listener.) 

   This is not the case for `click`. A `click` listener which would catch `click`s from different elements that react to `click` would likely need to process which element triggered the `click`. Thus, a "catch-high" strategy works poorly for `click`, while often works fine for `beforeinput`. There is little benefit of the umbrella name.    

2. The state changing action of the `beforeinput` event is directly discernible by looking only at the `target` of the event. This makes it simple to split or filter the `beforeinput` event simply using an `if (e.target instanceof HTMLSelectElement) {...}`. This makes the cost of clustering many similar state changes under the same name low.
 
   This is not the case with `click`. The state changing action of a `click` event might be associated with an ancestor of the `target`. To discover which state changing action a `click` induces therefore require a more complex algorithm, which costs more, both in performance and in developer complexity.


To summarize. If you add a state changing reaction to an event, either from a web component or an event controller, then you should strongly consider heralding this state change with its own, new event type (cf. `submit`). Similarly, you should try to avoid adding a state change directly to an existing event, without adding a preceding event to distinguish it (cf. `click`). If you have many similar state changing actions that you consider giving an umbrella name, do so primarily if the action can be discerned from the trigger event's `target` directly (cf. `beforeinput`).
    
## References

 * 