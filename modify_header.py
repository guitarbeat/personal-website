import sys

filename = "src/components/content/Header/Header.tsx"

with open(filename, "r") as f:
    lines = f.readlines()

new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    # Remove import
    if line.strip() == 'import PropTypes from "prop-types";':
        continue

    # Remove SocialMedia.propTypes
    if line.strip().startswith("SocialMedia.propTypes = {"):
        skip_until = i + 1
        while not lines[skip_until].strip().endswith("};"):
            skip_until += 1
        continue

    # Remove ChatBubble.propTypes
    if line.strip().startswith("ChatBubble.propTypes = {"):
        skip_until = i + 1
        while not lines[skip_until].strip().endswith("};"):
            skip_until += 1
        continue

    # Remove HeaderText.propTypes
    if line.strip().startswith("HeaderText.propTypes = {"):
        skip_until = i + 1
        while not lines[skip_until].strip().endswith("};"):
            skip_until += 1
        continue

    if i <= skip_until:
        continue

    new_lines.append(line)

with open(filename, "w") as f:
    f.writelines(new_lines)
