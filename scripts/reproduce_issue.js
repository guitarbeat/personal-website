const { performance } = require('perf_hooks');

// --- Mocks ---
const window = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const document = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

class HTMLElement {
  constructor() {
    this.scrollLeft = 0;
    this.scrollTop = 0;
  }
}

let frameCount = 0;
let isRunning = true;

const requestAnimationFrame = (callback) => {
  if (!isRunning) return;
  frameCount++;
  // Don't actually run infinitely in this script, just enough to prove it loops
  if (frameCount > 20) {
      console.log('Limit reached, stopping recursion for safety.');
      return 123;
  }
  setTimeout(callback, 16); // Simulate ~60fps
  return frameCount;
};

const cancelAnimationFrame = (id) => {
  // no-op for now
};

// --- Utils from commonUtils.ts ---

const copyPoint = (point) => ({ ...point });

const subtractPoints = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

const createTimeout = (callback, time) => {
  const timeout = setTimeout(callback, time);
  return () => clearTimeout(timeout);
};

const throttleTS = (func, limit) => {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// --- Target Code from scrollSpeed.ts ---

function getElementScrollPosition(element) {
  return {
    x: element.scrollLeft,
    y: element.scrollTop,
  };
}

function initializeScrollSpeedWatcher(element, onChange) {
  let lastPosition = getElementScrollPosition(element);
  let currentPosition = copyPoint(lastPosition);
  let speed = subtractPoints(currentPosition, lastPosition);
  let rafId = null;
  let isProgrammaticScroll = false;

  const updateSpeed = (newSpeed) => {
    speed = newSpeed;
    onChange(speed);
  };

  const clearSpeed = () => {
    updateSpeed({ x: 0, y: 0 });
  };

  let clearSpeedTimeout = createTimeout(() => {}, 50);

  // Handle programmatic scrolls from infinite scroll
  const handleProgrammaticScroll = (event) => {
    isProgrammaticScroll = true;
    const { fromY, toY } = event.detail;
    const virtualSpeed = { x: 0, y: (toY - fromY) / 4 };
    updateSpeed(virtualSpeed);

    setTimeout(() => {
      isProgrammaticScroll = false;
      clearSpeed();
    }, 100);
  };

  // Use requestAnimationFrame for smooth updates
  const updateFrame = () => {
    if (isProgrammaticScroll) return;

    lastPosition = currentPosition;
    currentPosition = getElementScrollPosition(element);
    const newSpeed = subtractPoints(currentPosition, lastPosition);

    // Only update if there's actual movement
    if (newSpeed.x !== 0 || newSpeed.y !== 0) {
      updateSpeed(newSpeed);
      clearSpeedTimeout();
      clearSpeedTimeout = createTimeout(clearSpeed, 30);
    }

    // THE BUG: Unconditional recursion
    rafId = requestAnimationFrame(updateFrame);
  };

  const handleScroll = throttleTS((_event) => {
    if (rafId === null && !isProgrammaticScroll) {
      rafId = requestAnimationFrame(updateFrame);
    }
  }, 8);

  // Trigger initial frame manually to start the loop for the test if handleScroll isn't called
  // In the real code, handleScroll starts it.

  // Publicly expose handleScroll for testing
  return { handleScroll };
}

// --- Test Execution ---

const element = new HTMLElement();
console.log('Starting Test...');

// Mock onChange
const onChange = (speed) => {
  console.log(`Speed updated: x=${speed.x}, y=${speed.y}`);
};

const watcher = initializeScrollSpeedWatcher(element, onChange);

// Simulate a scroll event
console.log('Simulating scroll event...');
watcher.handleScroll({});

// Wait and see if frames keep incrementing
setTimeout(() => {
    console.log(`Frame count after 500ms: ${frameCount}`);
    if (frameCount >= 20) {
        console.log('SUCCESS: Reproduced infinite loop (frame count hit safety limit).');
    } else {
        console.log('FAILURE: Frame count did not increase as expected.');
    }
    isRunning = false; // Stop the loop
}, 1000);
