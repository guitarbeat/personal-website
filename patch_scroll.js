const fs = require('fs');
const file = 'src/components/effects/Blur/scrollSpeed.ts';
let content = fs.readFileSync(file, 'utf8');

// The original content string we expect to replace:
const originalStr = `  // Use requestAnimationFrame for smooth updates
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

    rafId = requestAnimationFrame(updateFrame);
  };`;

// What we want to replace it with:
const newStr = `  // Use requestAnimationFrame for smooth updates
  const updateFrame = () => {
    if (isProgrammaticScroll) {
      rafId = null;
      return;
    }

    lastPosition = currentPosition;
    currentPosition = getElementScrollPosition(element);
    const newSpeed = subtractPoints(currentPosition, lastPosition);

    // Only update if there's actual movement
    if (newSpeed.x !== 0 || newSpeed.y !== 0) {
      updateSpeed(newSpeed);
      clearSpeedTimeout();
      clearSpeedTimeout = createTimeout(clearSpeed, 30);
      rafId = requestAnimationFrame(updateFrame);
    } else {
      rafId = null;
    }
  };`;

if (content.includes(newStr)) {
  console.log("Already patched.");
} else if (content.includes(originalStr)) {
  content = content.replace(originalStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Patched successfully.");
} else {
  console.log("Error: Could not find target string to replace.");
}
