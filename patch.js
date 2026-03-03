const fs = require('fs');
const file = 'src/components/effects/Blur/scrollSpeed.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`    // Only update if there's actual movement
    if (newSpeed.x !== 0 || newSpeed.y !== 0) {
      updateSpeed(newSpeed);
      clearSpeedTimeout();
      clearSpeedTimeout = createTimeout(clearSpeed, 30);
    }

    rafId = requestAnimationFrame(updateFrame);`,
`    // Only update if there's actual movement
    if (newSpeed.x !== 0 || newSpeed.y !== 0) {
      updateSpeed(newSpeed);
      clearSpeedTimeout();
      clearSpeedTimeout = createTimeout(clearSpeed, 30);
      rafId = requestAnimationFrame(updateFrame);
    } else {
      rafId = null;
    }`
);

fs.writeFileSync(file, content);
