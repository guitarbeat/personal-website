const fs = require('fs');

const matrixFile = 'src/components/effects/Matrix/Matrix.tsx';
let matrixContent = fs.readFileSync(matrixFile, 'utf8');

// The biome comment needs to go above the element entirely
matrixContent = matrixContent.replace(
`<div
                // biome-ignore lint/a11y/noStaticElementInteractions: viewport needs to be focusable
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >`,
`{/* biome-ignore lint/a11y/noStaticElementInteractions: viewport needs to be focusable */}
              <div
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >`
);

fs.writeFileSync(matrixFile, matrixContent);
