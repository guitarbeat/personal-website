import sys

with open('src/contexts/NotionContext.tsx', 'r') as f:
    content = f.read()

if 'export const NotionContext' not in content:
    content = content.replace('const NotionContext = createContext', 'export const NotionContext = createContext')
    with open('src/contexts/NotionContext.tsx', 'w') as f:
        f.write(content)
