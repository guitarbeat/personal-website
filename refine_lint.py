import sys

file_path = 'src/components/effects/Matrix/Matrix.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    if skip:
        skip = False
        continue

    stripped = line.strip()

    # Case 1: Convert to JSX comment
    if 'biome-ignore lint/a11y/noStaticElementInteractions' in line:
        indent = line[:line.find('/')]
        new_lines.append(f'{indent}{{/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive viewport area */}}\n')
        continue

    # Case 2: Move comment out of return ( ... )
    if 'return (' in line and i+1 < len(lines) and 'biome-ignore lint/suspicious/noArrayIndexKey' in lines[i+1]:
        indent = line[:line.find('return')]
        new_lines.append(f'{indent}// biome-ignore lint/suspicious/noArrayIndexKey: Terminal output is stable\n')
        new_lines.append(line)
        skip = True # skip next line (the original comment line)
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Refined lint suppression format.")
