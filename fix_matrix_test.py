import sys

with open('src/components/effects/Matrix/__tests__/Matrix.benchmark.test.tsx', 'r') as f:
    content = f.read()

# Add act around jest.advanceTimersByTime to resolve the act(...) error
if 'act(() => {' not in content:
    content = content.replace("import { render, screen }", "import { render, screen, act }")
    content = content.replace("jest.advanceTimersByTime(16);", "act(() => { jest.advanceTimersByTime(16); });")

with open('src/components/effects/Matrix/__tests__/Matrix.benchmark.test.tsx', 'w') as f:
    f.write(content)
