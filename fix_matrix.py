import re

with open("src/components/effects/Matrix/Matrix.tsx", "r") as f:
    content = f.read()

# Fix 2: noArrayIndexKey syntax error inside return ()
# Currently:
#                     return (
#                       {/* biome-ignore lint/suspicious/noArrayIndexKey: log display append-only */}
#                       <div key={i} className={className}>

content = re.sub(
    r'\{\/\* biome-ignore lint\/suspicious\/noArrayIndexKey: log display append-only \*\/\}\n\s*<div key=\{i\}',
    r'<div\n                      // biome-ignore lint/suspicious/noArrayIndexKey: log display append-only\n                      key={i}',
    content,
    flags=re.DOTALL
)

with open("src/components/effects/Matrix/Matrix.tsx", "w") as f:
    f.write(content)
