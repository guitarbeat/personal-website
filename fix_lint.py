import re

with open('src/components/effects/Matrix/useMatrixRain.ts', 'r') as f:
    content = f.read()

# Fix unused suppression
content = re.sub(
    r'// biome-ignore lint/suspicious/noExplicitAny: Navigator extension properties\n    const isSlowDevice =',
    'const isSlowDevice =',
    content
)

with open('src/components/effects/Matrix/useMatrixRain.ts', 'w') as f:
    f.write(content)

with open('src/components/effects/Matrix/Matrix.tsx', 'r') as f:
    content = f.read()

# Fix static element interactions
content = re.sub(
    r'<div\n                className="hack-input-viewport"\n                onMouseDown=\{handleViewportEngage\}\n                onTouchStart=\{handleViewportEngage\}\n              >',
    '// biome-ignore lint/a11y/noStaticElementInteractions: Matrix effect viewport needs specific mouse/touch handling without being a button\n              <div\n                className="hack-input-viewport"\n                onMouseDown={handleViewportEngage}\n                onTouchStart={handleViewportEngage}\n              >',
    content
)

# Fix array index key
content = re.sub(
    r'<div key=\{i\} className=\{className\}>',
    '// biome-ignore lint/suspicious/noArrayIndexKey: Log list relies on array order and does not reorder\n                      <div key={i} className={className}>',
    content
)

with open('src/components/effects/Matrix/Matrix.tsx', 'w') as f:
    f.write(content)
