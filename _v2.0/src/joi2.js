export {toggleTick} from "./toggleTick.js";
export {SlottablesEvent} from "./slottablesEvent.js";

import {} from "./nativeDefaultActions.js";
import {} from "./JoiEventPatchNew.js";
import {addPropagationRootInterface} from "./PropagationRootInterface.js";

addPropagationRootInterface(ShadowRoot.prototype);
addPropagationRootInterface(Document.prototype);
addPropagationRootInterface(Window.prototype);