export {toggleTick} from "./toggleTick.js";
export {SlottablesEvent} from "./slottablesEvent.js";
export {queueEvent} from "./PropagationRootInterface.js";

import {} from "./nativeDefaultActions.js";
import {} from "./JoiEventPatchNew.js";

import {addPropagationRootInterface} from "./PropagationRootInterface.js";

addPropagationRootInterface(ShadowRoot.prototype);
addPropagationRootInterface(Document.prototype);
addPropagationRootInterface(Window.prototype);

import {addLastEventListenerOption} from "./EventListenerOption_last.js";
addLastEventListenerOption(EventTarget.prototype);