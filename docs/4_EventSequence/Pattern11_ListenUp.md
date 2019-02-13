## Pattern: ListenUp

The ListenUp pattern limits your cost by adding event listeners as *late as possible*, and not upfront.
The pattern is simple. You have a composed event that listens for two or three different types of events.
These events must occur in a certain order. And therefore you would at first only listen for one primary 
trigger event, and only when this primary trigger event occurs add the event listeners for the secondary 
and final trigger events.

## Example: Naive `long-press`

The most simple example of a ListenUp composed event is a mouse `naive-long-press`. 
The `naive-long-press` event is dispatched every time the user presses on a target for more than 300ms.
To make the example simple to read, the target pressed must be a leaf DOM element. 
The primary trigger event of the `naive-long-press` event is the `mousedown` event.
The `naive-long-press` only has a secondary trigger event, `mouseup`, and 
the `mouseup` is also the final trigger event that concludes a series.    

<script src="https://cdn.jsdelivr.net/npm/joievents@1.0.0/src/webcomps/PrettyPrinter.js"></script>
<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/gestures/long-press-ListenUp.js"></pretty-printer>

## References

 * 