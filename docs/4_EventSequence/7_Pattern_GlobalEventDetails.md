# Pattern: GlobalEventDetails

We want the details of an EventSequence's state to be readable from JS. To do so, we simply add a global object on the `window`, such as `EventLongPress` and populate it when needed.

The benefits of adding such a global object is not only that it can be used to read the details of an EventSequence's state (when it is going on), but also that the presence of the global object itself can be used to assess whether or not you need to load a `long-press` library or not.

## References

 * [dunno]()