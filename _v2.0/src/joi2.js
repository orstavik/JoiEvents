//import {} from "./toggleTick.js";
//window["nextTick"] = window["nextTick"] || setTimeout;
//(toggleTick||setTimeout)()    //use this instead of import?? don't know the pros/cons of this method of import.

// * nextTick
//this will ensure that there is a nextTick, but you don't have to load if you don't want to.
// https://cdn.jsdelivr.net/combine/gh/orstavik@1.2/nextTick/nextTick.min.js,gh/orstavik/joi@3.3/dist/index.min.js

//todo Do the sequence EventListenerOptions matter??
//Dependencies for EventControllers
import {addPropagationRootInterface} from "./PropagationRootInterface.js";  //1. PropagationRootInterface with root.defineEvent(eventController);
addPropagationRootInterface(ShadowRoot.prototype);
addPropagationRootInterface(Document.prototype);
addPropagationRootInterface(Window.prototype);
import {} from "./dispatchEvent_asyncAndBounce.js";                         //2. dispatchAsyncAndBounce
// todo sequence matters here. No other methods should later override dispatchEvent unless they call this version of dispatchEvent at the end, since the async dispatchEvent will no longer return
import {addCaptureToBubbleEventListenerOption} from "./EventListenerOption_captureToBubble.js";
addCaptureToBubbleEventListenerOption(ShadowRoot.prototype);                //3. EventListenerOption.CaptureToBubble
addCaptureToBubbleEventListenerOption(Document.prototype);
addCaptureToBubbleEventListenerOption(Window.prototype);
//todo import {addFirstEventListenerOption} from "./EventListenerOption_first.js"; //4. EventListenerOption.first for grabbing composed: true events.
//todo addFirstEventListenerOption(Window.prototype);//we only need the event listener registry to stop composed: true events.

//todo if we don't have Event.setDefault(), we can fallback to do Event.setDefault() to be setTimeout. And there we also have the event.
//todo but, this will of course have the wrong timing and preventDefault() will not control it. Or, we could make preventDefault() control it slightly, but not completely.

//Dependencies for web components
export {SlottablesEvent} from "./slottablesEvent.js";                       //1. the mixins for slottablesCallback and styleCallback
// export {StyleCallbackMixin} from "./slottablesEvent.js";
import {} from "./Event_setDefault.js";                                     //2. the setDefault()
import {addLastEventListenerOption} from "./EventListenerOption_last.js";   //3. EventListenerOption.last
addLastEventListenerOption(EventTarget.prototype);
//4. EventListenerOption.unstoppable
import {} from "./EventListenerOption_unstoppable.js";