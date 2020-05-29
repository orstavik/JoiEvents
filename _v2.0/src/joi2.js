//import {} from "./toggleTick.js";
window["nextTick"] = window["nextTick"] || setTimeout;

// * nextTick
//this will ensure that there is a nextTick, but you don't have to load if you don't want to.
// https://cdn.jsdelivr.net/combine/
// gh/orstavik@1.2/nextTick/nextTick.min.js
// ,
// gh/orstavik/joi@3.3/dist/index.min.js

//todo I don't know the sequence of these imports on addEventListener especially.
//todo I don't know if the sequence here matters.
//Dependencies for EventControllers
import {addPropagationRootInterface} from "./PropagationRootInterface.js";  //1. PropagationRootInterface with root.defineEvent(eventController);
addPropagationRootInterface(ShadowRoot.prototype);
addPropagationRootInterface(Document.prototype);
addPropagationRootInterface(Window.prototype);

import {} from "./dispatchEvent_asyncAndBounce.js";                         //2. dispatchAsyncAndBounce
                                                                            //3. EventListenerOption.CaptureToBubble
import {addCaptureToBubbleEventListenerOption} from "./EventListenerOption_captureToBubble.js";
addCaptureToBubbleEventListenerOption(ShadowRoot.prototype);
addCaptureToBubbleEventListenerOption(Document.prototype);
addCaptureToBubbleEventListenerOption(Window.prototype);
//4. EventListenerOption.first for grabbing composed: true events.

//(nextTick||setTimeout)()    //use this instead of import?? don't know the pros/cons of this method of import.

//Dependencies for web components
export {SlottablesEvent} from "./slottablesEvent.js";                       //1. the mixins for slottablesCallback and styleCallback
// export {StyleCallbackMixin} from "./slottablesEvent.js";
import {} from "./Event_setDefault.js";                                     //2. the setDefault()
import {addLastEventListenerOption} from "./EventListenerOption_last.js";   //3. EventListenerOption.last
addLastEventListenerOption(EventTarget.prototype);
//4. EventListenerOption.unstoppable
import {} from "./EventListenerOption_unstoppable.js";