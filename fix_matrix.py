import re

with open("src/components/effects/Matrix/Matrix.tsx", "r") as f:
    content = f.read()

# Replace the div with the proper attributes
old_div = """              <div
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >"""

new_div = """              <div
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
                role="button"
                tabIndex={0}
                onKeyDown={handleViewportEngage}
              >"""

if old_div in content:
    content = content.replace(old_div, new_div)
    with open("src/components/effects/Matrix/Matrix.tsx", "w") as f:
        f.write(content)
    print("Fixed Matrix.tsx")
else:
    print("Could not find the target div in Matrix.tsx")
