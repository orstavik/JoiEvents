//Basic version

//rule #2: all events propagate sync. No more async propagation for UI events. Which is good, because you can never
//         tell if an event is async or sync.
//rule #3: all adding of event listeners are dynamic.
//         No more special rule that event listeners on the same target(phase) can be removed, but not added.

//tip 1:   all event listeners are removed when the event stack is empty.
//tip 2:   AT_TARGET works 'the old way', as event listeners on the innermost target.
//         This means the sum of both capture and bubble event listeners run in insertion order, not necessarily capture before bubble.
//         It is my opinion that it might be better to always run capture before bubble, also at_target, but
//         the 'old way' is chosen because I guess that this will cause the least disturbances in existing web apps.

import {bounceSequence} from "./lib/BouncedPath.js";
import {tick} from "./lib/EventLoop.js";
import {setTickOrganizer} from "./lib/EventTargetHighJacker.js";

setTickOrganizer(tick, bounceSequence);