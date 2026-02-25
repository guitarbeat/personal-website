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

    # Check for the comment line I inserted before return
    if '// biome-ignore lint/suspicious/noArrayIndexKey' in line and i+1 < len(lines) and 'return (' in lines[i+1]:
        indent = lines[i+1][:lines[i+1].find('return')]
        # Prepare comment line with extra indent
        comment_line = f'{indent}  /* biome-ignore lint/suspicious/noArrayIndexKey: Terminal output is stable */\n'

        # Append return line
        new_lines.append(lines[i+1])
        # Append comment line
        new_lines.append(comment_line)
        skip = True # skip return line in next iteration
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Changed suppression to block comment inside return.")
