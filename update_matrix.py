import re

file_path = 'src/components/effects/Matrix/Matrix.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add import
import_statement = 'import { Drop, MAX_FONT_SIZE, MIN_FONT_SIZE } from "./MatrixDrop";'
# Insert after existing imports. Let's look for the last import.
# Or just insert after the first block of imports.
# imports end around line 15.
# We can insert before "const MIN_FONT_SIZE = 12;" if we find it, then delete it.

# 2. Remove MIN_FONT_SIZE and MAX_FONT_SIZE
# They are defined as:
# const MIN_FONT_SIZE = 12;
# const MAX_FONT_SIZE = 18;

content = content.replace('const MIN_FONT_SIZE = 12;\n', '')
content = content.replace('const MAX_FONT_SIZE = 18;\n', '')

# Insert the import statement at the top, after other imports.
# We can insert it before the first const definition or after the last import.
# Let's search for the line "import deniedImage ..." and insert after it.
match = re.search(r'import deniedImage .*?;\n', content)
if match:
    end_pos = match.end()
    content = content[:end_pos] + '\n' + import_statement + '\n' + content[end_pos:]
else:
    # Fallback: insert at top
    content = import_statement + '\n' + content

# 3. Remove ALPHABET definition
# It matches:
#   const ALPHABET =
#     "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

alphabet_pattern = r'\s*const ALPHABET =\s*\n\s*"[^"]*";\n'
content = re.sub(alphabet_pattern, '', content)

# 4. Remove Drop class definition
# Matches:
#     class Drop {
#       ...
#     }
#
# It is inside useEffect.
# Use regex to find the class block.
# Assuming standard formatting, it starts with "class Drop {" and ends with "}" before "const columns"

class_pattern = r'\s*class Drop \{[\s\S]*?\}\n'
# Be careful not to match too much.
# The class ends before
# Let's verify the context.
# ... handleResize);
#
#     class Drop { ... }
#
#     const columns = ...

content = re.sub(class_pattern, '\n', content, count=1)

# 5. Update drop.update() to drop.update(canvas.height)
# Inside drawFrame function.
# for (const drop of drops) {
#   drop.update();
# }
#
# Replace drop.update() with drop.update(canvas.height)

content = content.replace('drop.update();', 'drop.update(canvas.height);')

with open(file_path, 'w') as f:
    f.write(content)

print("Matrix.tsx updated.")
