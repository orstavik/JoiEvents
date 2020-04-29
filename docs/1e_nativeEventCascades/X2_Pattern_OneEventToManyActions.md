# Pattern: event-action-event-action

events can trigger one action. or many actions

actions can trigger new events. or not.

Some events such as `click` and `touchmove` have *many* possible default actions. These events are quite confusing. And full of if-then semantic logic. We can say such events-to-defaultAction pairs conform to a OneEventToManyActions pattern.
 
## todo 

Some events such as `submit` only have *one* possible default action. They are simple. Likeable. And we say that these events-to-defaultAction pairs conform to a OneEventToOneAction pattern.

## pattern about timers

pattern about using timers. such as with dblclick keypress and resize!! scroll... and more.

## References

 * dunno