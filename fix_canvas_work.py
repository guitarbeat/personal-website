import sys

with open('src/components/content/Work/Work.test.tsx', 'r') as f:
    content = f.read()

mock_pixel_canvas = """
jest.mock("../../../components/effects/PixelCanvas/PixelCanvas", () => {
  return function MockPixelCanvas() {
    return <div data-testid="mock-pixel-canvas" />;
  };
});
"""

if "MockPixelCanvas" not in content:
    content = content.replace('import Work from "./Work";', mock_pixel_canvas + '\nimport Work from "./Work";')

with open('src/components/content/Work/Work.test.tsx', 'w') as f:
    f.write(content)
