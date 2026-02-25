import re

file_path = 'src/components/effects/Matrix/Matrix.tsx'

with open(file_path, 'r') as f:
    content = f.read()

start_marker = 'window.addEventListener("resize", handleResize);'
end_marker = 'const columns ='

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos != -1 and end_pos != -1:
    # Keep the markers, remove content between them
    new_content = content[:start_pos + len(start_marker)] + '\n\n    ' + content[end_pos:]

    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Cleaned up leftover class methods.")
else:
    print(f"Markers not found. start_pos={start_pos}, end_pos={end_pos}")
