import { initializeScrollSpeedWatcher } from "../src/components/effects/Blur/scrollSpeed";

let rafCallbacks: { cb: FrameRequestCallback, id: number }[] = [];
let nextRafId = 1;
let rafCalls = 0;

global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  const id = nextRafId++;
  rafCallbacks.push({ cb, id });
  return id;
};

global.cancelAnimationFrame = (id: number) => {
  rafCallbacks = rafCallbacks.filter(r => r.id !== id);
};

const runRaf = () => {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(r => {
    rafCalls++;
    r.cb(0);
  });
};

global.setTimeout = ((cb: any) => cb()) as any;
global.clearTimeout = () => {};
global.Date.now = () => 0;

let windowListeners: any = {};
global.window = {
  addEventListener: (e: string, cb: any) => windowListeners[e] = cb,
  removeEventListener: (e: string) => delete windowListeners[e]
} as any;

let documentListeners: any = {};
global.document = {
  addEventListener: (e: string, cb: any) => documentListeners[e] = cb,
  removeEventListener: (e: string) => delete documentListeners[e]
} as any;

const mockElement = { scrollLeft: 0, scrollTop: 0 } as any;

initializeScrollSpeedWatcher(mockElement, () => {});

documentListeners['scroll']({});
runRaf(); // loop starts
console.log("Raf callbacks queued (normal scroll):", rafCallbacks.length);

// Instead of immediate timeout, let's control it
let timeoutCb: any;
global.setTimeout = ((cb: any) => { timeoutCb = cb; }) as any;

windowListeners['programmaticScroll']({ detail: { fromY: 0, toY: 100 } });
runRaf(); // loop should die because of return
console.log("Raf callbacks queued (after prog scroll):", rafCallbacks.length);

timeoutCb(); // isProgrammaticScroll = false

global.Date.now = () => 10000; // bypass throttle
documentListeners['scroll']({}); // should restart?
console.log("Raf callbacks queued (after scroll resume):", rafCallbacks.length);
