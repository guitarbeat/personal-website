import sys

with open('src/components/effects/Matrix/__tests__/Matrix.benchmark.test.tsx', 'r') as f:
    content = f.read()

# I see the `import { render, screen, act }` replacement didn't work because `import { render, screen }` wasn't there.
# Let's fix this properly.
content = content.replace('import { render } from "@testing-library/react";', 'import { render, act } from "@testing-library/react";')
content = content.replace('jest.advanceTimersByTime(200);', 'act(() => { jest.advanceTimersByTime(200); });')
content = content.replace('window.dispatchEvent(resizeEvent);', 'act(() => { window.dispatchEvent(resizeEvent); });')

with open('src/components/effects/Matrix/__tests__/Matrix.benchmark.test.tsx', 'w') as f:
    f.write(content)
