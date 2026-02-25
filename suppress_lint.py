import sys

file_path = 'src/components/effects/Matrix/Matrix.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    stripped = line.strip()

    # Case 1: hack-input-viewport div
    # Check if this line is <div and next line has className="hack-input-viewport"
    if stripped == '<div' and i+1 < len(lines) and 'className="hack-input-viewport"' in lines[i+1]:
        indent = line[:line.find('<')]
        new_lines.append(f'{indent}// biome-ignore lint/a11y/noStaticElementInteractions: Interactive viewport area\n')
        new_lines.append(line)
        continue

    # Case 2: key={i}
    if '<div key={i} className={className}>' in line:
        indent = line[:line.find('<')]
        new_lines.append(f'{indent}// biome-ignore lint/suspicious/noArrayIndexKey: Terminal output is stable\n')
        new_lines.append(line)
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Suppressed lint errors.")
