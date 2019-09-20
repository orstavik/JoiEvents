# HowTo: drag-n-drop

The native gesture drag-n-drop is supported by the following browsers...

Is it a polyfill??

## What is the native `drag` event?

[`drag-and-drop`](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) is a 
This is a native gesture/native DOM Event.
To activate it, one must add an HTML attribute `draggableSection="true"`.
It is a good native event, but it is hard to control the visuals of this event.

tomax find some good reviews/critiques of this native gesture

## Why make a custom dragging event?

Create a `drag` event that:
1. is easier to control.
2. has more methods, such as `fling()`
3. that maps `.preventDefault()`
4. can be controlled via HTML attributes

## References

 * [layout problems with HTML5 drag'n'drop](https://kryogenix.org/code/browser/custom-drag-image.html)
                                                                            