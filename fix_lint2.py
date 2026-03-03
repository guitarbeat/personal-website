import re

with open('src/contexts/NotionContext.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'interface NotionData \{\n  projects: any\[\];\n  work: any\[\];\n  about: any\[\];\n\}',
    'interface NotionData {\n  // biome-ignore lint/suspicious/noExplicitAny: Data shapes vary widely from Notion API\n  projects: any[];\n  // biome-ignore lint/suspicious/noExplicitAny: Data shapes vary widely from Notion API\n  work: any[];\n  // biome-ignore lint/suspicious/noExplicitAny: Data shapes vary widely from Notion API\n  about: any[];\n}',
    content
)

content = re.sub(
    r'\} catch \(err: any\) \{',
    '} catch (err: any) { // biome-ignore lint/suspicious/noExplicitAny: Unknown error from fetch',
    content
)

with open('src/contexts/NotionContext.tsx', 'w') as f:
    f.write(content)
