const fs = require('fs');

// Patch App.tsx for unused parameter
const appFile = 'src/App.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace(
`    navItems,
    onMatrixActivate,
    onScrollActivate,
    isInScroll,`,
`    navItems,
    onMatrixActivate,
    onScrollActivate: _onScrollActivate,
    isInScroll,`
);
fs.writeFileSync(appFile, appContent);


// Patch Matrix.tsx for errors
const matrixFile = 'src/components/effects/Matrix/Matrix.tsx';
let matrixContent = fs.readFileSync(matrixFile, 'utf8');
matrixContent = matrixContent.replace(
`<div
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >`,
`<div
                // biome-ignore lint/a11y/noStaticElementInteractions: viewport needs to be focusable
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >`
);

matrixContent = matrixContent.replace(
`<div key={i} className={className}>`,
`// biome-ignore lint/suspicious/noArrayIndexKey: log display
                      <div key={i} className={className}>`
);

fs.writeFileSync(matrixFile, matrixContent);
