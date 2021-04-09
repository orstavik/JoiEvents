function makeSlottables(newChildren, oldChildren) {
  return {
    newChildren, oldChildren,
    get added() {
      return newChildren.filter(el => !oldChildren.includes(el));
    },
    get removed() {
      return oldChildren.filter(el => !newChildren.includes(el));
    }
  };
}

const slotablesElements = new WeakMap();

function doCallback(target, oldChildren) {
  try {
    slotablesElements.set(target, target.childNodes);
    target.slotablesCallback(makeSlottables(target.childNodes, oldChildren));
  } catch (error) {
    const slotError = new ErrorEvent('error', {error, message: 'Uncaught Error: slottablesCallback() break down'});
    window.dispatchEvent(slotError);
    !slotError.defaultPrevented && console.error(slotError);
  }
}

const childNodesObs = new MutationObserver(function (data) {
  for (let target of new Set(data.map(({target}) => target)))
    doCallback(target, slotablesElements.get(target));
});


const empty = Object.freeze([]);

function setupNow(el) {
  childNodesObs.observe(el, {childList: true});
  doCallback(el, empty);
}

function setupActive(el) {
  return Promise.resolve().then(() => Promise.resolve().then(() => setupNow(el)));
}

let setup = setupActive;

if (document.readyState === "loading") {
  const que = [];
  setup = function setupQueued(el) {
    return que.push(el);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setup = setupActive;
    //todo how do we want to sort the que in tree order? bottom up is best? reverse propagation context order seems best here?
    que.sort((a, b) => a.compareDocumentPosition(b) & 2 ? 1 : -1).forEach(setupNow);
  });
}

export function SlottableCallbackElementMixin(Base) {
  return class SlottableCallbackElementMixin extends Base {
    constructor() {
      super();
      setup(this);
    }
  }
}