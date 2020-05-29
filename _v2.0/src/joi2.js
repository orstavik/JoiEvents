export {toggleTick} from "./toggleTick.js";
export {SlottablesEvent} from "./slottablesEvent.js";

//todo I don't know the sequence of these imports on addEventListener especially.
//todo I don't know if the sequence here matters.
export {queueEvent} from "./PropagationRootInterface.js";
// import {} from "./dispatchEvent_asyncAndBounce.js"; //todo add this one, replaces the export {queueEvent} from "./PropagationRootInterface.js";
import {} from "./Event_setDefault.js";
import {} from "./EventListenerOption_unstoppable.js";
import {addPropagationRootInterface} from "./PropagationRootInterface.js";
addPropagationRootInterface(ShadowRoot.prototype);
addPropagationRootInterface(Document.prototype);
addPropagationRootInterface(Window.prototype);
import {addLastEventListenerOption} from "./EventListenerOption_last.js";
addLastEventListenerOption(EventTarget.prototype);

//todo make a clearer separation about which are needed for the default action (which is necessary to make the elements
//which are needed to make the elements?
//1. the mixins for slottablesCallback and styleCallback
//2. the setDefault()
//3. EventListenerOption.last
//4. EventListenerOption.unstoppable

//which are needed to make the EventControllers?
//1. PropagationRootInterface
//2. dispatchAsyncAndBounce
//3. EventListenerOption.CaptureToBubble
//4. EventListenerOption.first for grabbing composed: true events.
//5. toggleTick