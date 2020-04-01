# WhatIs: past- and future-tense events?

Events can announce state changes that *has already occurred* or *will occur*. For example `contextmenu` is dispatched *before* the browser will show its native context menu over an element, and a `change` event is dispatched *after* an input element has changed its state.

## Past-tense events

**Past-tense events** announce a past, completed state change.
 
An event should not be dispatched *during* an ongoing event change. The event should either pass before the state change begins or after the state change is completed. If you need to announce the state of an ongoing event, such as with `scroll` or `mousemove`, you announce several events that all unequivocally depict a *completed state change* that is part of a series of such state changes. Try to prefix and postfix events alerting about state changes with start- and end-events, such as in `compositionstart`, `compositionupdate`, and `compositionend`.   

## Future-tense events

**Future-tense events** announce a future, coming state change.
 
Many *future*-tense events represent both a past state change and a possible future state change. For example, a `click` can alert about a past state that has already occurred (a `mousedown` and `mouseup` over an `<button type="submit">`) and a future, coming state change (the dispatch of a `submit` event). Even the `submit` event also alerts about both past and future state changes: that a `<form>` elements submit function has been requested (either via `requestSubmit()` or via a `click` on a submit button) and that the `<form>`'s `submit()` method is about to be triggered.

If an event announces *both* past *and* future state changes, then the event should be considered *future-tense first*. Only if an event has *no* associated, default state change in any element should it be considered a past-tense event. Remember that scripts and web components can add actions to native past-tense events, which would make them future-tense in the context of that app.
    
## References

 * 