with open("src/components/effects/Matrix/Matrix.tsx", "r") as f:
    content = f.read()

content = content.replace("""              <div
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >""", """              {/* biome-ignore lint/a11y/noStaticElementInteractions: Terminal input area needs custom event handling without standard button semantics */}
              <div
                className="hack-input-viewport"
                onMouseDown={handleViewportEngage}
                onTouchStart={handleViewportEngage}
              >""")

content = content.replace("""                    return (
                      <div key={i} className={className}>
                        {line}
                      </div>
                    );""", """                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: Terminal lines are append-only, index is stable
                      <div key={i} className={className}>
                        {line}
                      </div>
                    );""")

with open("src/components/effects/Matrix/Matrix.tsx", "w") as f:
    f.write(content)
