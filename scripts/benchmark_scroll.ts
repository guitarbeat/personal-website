import { initializeScrollSpeedWatcher } from "../src/components/effects/Blur/scrollSpeed";

let rafCalls = 0;
let currentTime = 0;
let rafCallbacks: { cb: FrameRequestCallback, id: number }[] = [];
let nextRafId = 1;

global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  const id = nextRafId++;
  rafCallbacks.push({ cb, id });
  return id;
};

global.cancelAnimationFrame = (id: number) => {
  rafCallbacks = rafCallbacks.filter(r => r.id !== id);
};

// Mock setTimeout/clearTimeout
let timeouts: { cb: Function, time: number, id: NodeJS.Timeout }[] = [];
let nextTimeoutId = 1;

global.setTimeout = (cb: any, ms?: number) => {
  const id = nextTimeoutId++ as any;
  timeouts.push({ cb, time: currentTime + (ms || 0), id });
  return id;
};

global.clearTimeout = (id: any) => {
  timeouts = timeouts.filter(t => t.id !== id);
};

// Mock Date.now() for throttle
global.Date.now = () => currentTime;

const runTimers = (advanceMs: number) => {
  const targetTime = currentTime + advanceMs;

  while (currentTime < targetTime) {
    let nextStep = 1;

    currentTime += nextStep;

    const toRun = timeouts.filter(t => t.time <= currentTime);
    timeouts = timeouts.filter(t => t.time > currentTime);
    toRun.forEach(t => t.cb());

    if (currentTime % 16 === 0) {
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach(r => {
        rafCalls++;
        r.cb(currentTime);
      });
    }
  }
};

const mockElement = {
  scrollLeft: 0,
  scrollTop: 0
} as any as HTMLElement;

let scrollListeners: any[] = [];
global.document = {
  addEventListener: (event: string, cb: any) => {
    if (event === 'scroll') scrollListeners.push(cb);
  },
  removeEventListener: (event: string, cb: any) => {
    if (event === 'scroll') scrollListeners = scrollListeners.filter(l => l !== cb);
  }
} as any;

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {}
} as any;

const onChange = (speed: any) => {};

console.log("Starting benchmark...");

const cleanup = initializeScrollSpeedWatcher(mockElement, onChange);

// Initial state, no scroll
runTimers(100);
rafCalls = 0;

// Simulate scrolling
console.log("Simulating 10 scrolls over 160ms...");
for (let i = 0; i < 10; i++) {
  mockElement.scrollTop += 10;
  scrollListeners.forEach(l => l({}));
  runTimers(16);
}

const callsDuringScroll = rafCalls;
console.log(`RAF calls during scroll: ${callsDuringScroll}`);

// Simulate idle time
console.log("Simulating 5 seconds of idle time...");
rafCalls = 0; // Reset counter for idle time
runTimers(5000);

console.log(`RAF calls during idle: ${rafCalls}`);

cleanup();
