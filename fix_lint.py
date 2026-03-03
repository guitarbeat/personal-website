with open('src/components/effects/Matrix/useMatrixRain.ts', 'r') as f:
    content = f.read()

# Fix the lint errors
content = content.replace(
    '    const isOldBrowser =\n      !window.requestAnimationFrame || !window.cancelAnimationFrame;\n    // biome-ignore lint/suspicious/noExplicitAny: Navigator extension properties\n    const isSlowDevice =',
    '    const isOldBrowser =\n      !window.requestAnimationFrame || !window.cancelAnimationFrame;\n    const isSlowDevice ='
)

with open('src/components/effects/Matrix/useMatrixRain.ts', 'w') as f:
    f.write(content)
