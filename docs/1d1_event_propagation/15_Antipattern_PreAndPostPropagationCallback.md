# Antipattern: `prePropagationCallback()` and `postPropagationCallback()`

Using the extended event listeners, we can make an `Event.prePropagationCallback(type, cb)`. But. This would parallel the existing event listener system, like the GlobalEventHandlers such as `onclick`. Also worth noting here is that if the GlobalEventHandler functions had been selected to *always* first and *before* the addEventListener functions, then a GlobalEventHandler on `window` or `shadowRoot` would have functioned as a `.prePropagationCallback()`.

However, adding an `Event.prePropagationCallback()` leaves many questions without a good answer:
 * What should we do when we need more than one `prePropagationCallback()`? 
 * How can we access shadowRoots/documents for `composed: false` events handled?
 * Isn't it a source of complexity to have more than one queue for event listeners per target? Isn't that why the GlobalEventHandlers feel somewhat redundant and complexing? 
