Hm.. If we disregard all capture phase event listeners. We add only a bridge from capture phase to target event listener. So that when you add an event listener on the ShadowRoot or window, this is transported to the target when the event is non-bubbling. And with unstoppable, we can completely skip capture phase. And then we add a grab property, which essentially override all event listeners, functions as the old unstoppable. And cancels all toggleTick tasks by previous event listener controllers in the same dom and above. I don't think they should work for the dom context below. Then, we will get a nice bottom up bouncing by default for all event controllers that are necessary. The sorting comes by default. We add a couple of softish restrictions / conventions. Nothing must break if you break them, but you get clear guidance.

Ok, addToTarget: true. If this option is set, the event listener will: add a new event listener when triggered. This event listener will be the exact same, just that it will a) be added to the target in the same dom context and b) run once. OnTarget:true.




Add restriction for using composed: true event option.
