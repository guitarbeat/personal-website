import sys

with open('src/components/content/Projects/Projects.test.tsx', 'r') as f:
    content = f.read()

mock_pixel_canvas = """
jest.mock("../../../components/effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="mock-pixel-canvas" />;
  };
});
"""

if "MockPixelCanvas" not in content:
    content = content.replace('import Projects from "./Projects";', mock_pixel_canvas + '\nimport Projects from "./Projects";')

with open('src/components/content/Projects/Projects.test.tsx', 'w') as f:
    f.write(content)
