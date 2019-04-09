## Pattern: ListenUp

The ListenUp pattern limits your cost by adding event listeners as *late as possible*, and not upfront.
The pattern is simple. You have a composed event that listens for two or three different types of events.
These events must occur in a certain order. And therefore you would at first only listen for one primary 
trigger event. Then, and only when this primary trigger event occurs, you add the event listeners for the secondary 
trigger events.

## Example: Naive `long-press`

The most simple example of a ListenUp composed event is a naive mouse-based `long-press`. 
The naive `long-press` event is dispatched every time the user presses on a target for more than 300ms.
The primary trigger event of the `long-press` event is the `mousedown` event.
The `long-press` only has a secondary trigger event, `mouseup`, and 
the `mouseup` is also the final trigger event that concludes a series.    

<pretty-printer href="./demo/long-press-ListenUp.js"></pretty-printer>

To make the example simple to read, the target pressed must be a leaf DOM element. 

## References

 * dunno
