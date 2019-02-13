# Pattern: MaybeNavigate

[instant.page](//instant.page) is a great example.

To be more efficient, maybe the hover function could be replaced with a mouseenter function, 
that uses a setTimeout debouncer of some kind, maybe even a listener for subsequent mousemove events to see if the mouse slows down.

To be more precise, a mousemove listener could be added at critical times 
to verify if the mouse is slowing down, kinda aiming towards a point.
