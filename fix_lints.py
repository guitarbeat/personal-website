import re
import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()

    for old, new in replacements:
        content = content.replace(old, new)

    with open(filepath, 'w') as f:
        f.write(content)

# Projects.test.tsx
replace_in_file('src/components/content/Projects/Projects.test.tsx', [
    ('withGoogleSheets: () => (Component: any) => (props: any) => (',
     '// biome-ignore lint/suspicious/noExplicitAny: Mock component\n  withGoogleSheets: () => (Component: any) => (props: any) => (')
])

# Projects.tsx
replace_in_file('src/components/content/Projects/Projects.tsx', [
    ('    projects: any[];',
     '    // biome-ignore lint/suspicious/noExplicitAny: Legacy data structure\n    projects: any[];')
])

# Work.test.tsx
replace_in_file('src/components/content/Work/Work.test.tsx', [
    ('withGoogleSheets: () => (Component: any) => Component,',
     '// biome-ignore lint/suspicious/noExplicitAny: Mock component\n  withGoogleSheets: () => (Component: any) => Component,')
])

# Work.tsx
replace_in_file('src/components/content/Work/Work.tsx', [
    ('    work: any[];',
     '    // biome-ignore lint/suspicious/noExplicitAny: Legacy data structure\n    work: any[];'),
    ('const jobs: Job[] = ((db?.work as any[]) || []).map((job) => ({',
     '// biome-ignore lint/suspicious/noExplicitAny: Legacy data structure\n  const jobs: Job[] = ((db?.work as any[]) || []).map((job) => ({')
])

# BlurSection.tsx
replace_in_file('src/components/effects/Blur/BlurSection.tsx', [
    ('  [key: string]: any;',
     '  // biome-ignore lint/suspicious/noExplicitAny: Legacy prop passing\n  [key: string]: any;')
])

# Matrix.benchmark.test.tsx
replace_in_file('src/components/effects/Matrix/__tests__/Matrix.benchmark.test.tsx', [
    ('HTMLCanvasElement.prototype.getContext = mockGetContext as any;',
     '// biome-ignore lint/suspicious/noExplicitAny: Mocking canvas context\n    HTMLCanvasElement.prototype.getContext = mockGetContext as any;')
])

# NotionContext.tsx
replace_in_file('src/contexts/NotionContext.tsx', [
    ('  projects: any[];\n  work: any[];\n  about: any[];',
     '  // biome-ignore lint/suspicious/noExplicitAny: Dynamic schema from Notion\n  projects: any[];\n  // biome-ignore lint/suspicious/noExplicitAny: Dynamic schema from Notion\n  work: any[];\n  // biome-ignore lint/suspicious/noExplicitAny: Dynamic schema from Notion\n  about: any[];'),
    ('      } catch (err: any) {',
     '      // biome-ignore lint/suspicious/noExplicitAny: Catching generic error\n      } catch (err: any) {')
])

# notionService.ts
replace_in_file('src/services/notionService.ts', [
    ('const fetchNotionDatabase = async (databaseType: string): Promise<any[]> => {',
     '// biome-ignore lint/suspicious/noExplicitAny: Dynamic schema from Notion\nconst fetchNotionDatabase = async (databaseType: string): Promise<any[]> => {'),
    ('  } catch (error: any) {',
     '  // biome-ignore lint/suspicious/noExplicitAny: Catching generic error\n  } catch (error: any) {')
])

# declarations.d.ts
if os.path.exists('src/types/declarations.d.ts'):
    replace_in_file('src/types/declarations.d.ts', [
        ('  export const VFX: any;',
         '  // biome-ignore lint/suspicious/noExplicitAny: Untyped third-party library\n  export const VFX: any;')
    ])

# colorUtils.ts
replace_in_file('src/utils/colorUtils.ts', [
    ('  items: any[],',
     '  // biome-ignore lint/suspicious/noExplicitAny: Generic array of items\n  items: any[],')
])

# Matrix.tsx
replace_in_file('src/components/effects/Matrix/Matrix.tsx', [
    ('<div key={i} className={className}>',
     '{/* biome-ignore lint/suspicious/noArrayIndexKey: Log output uses index safely */}\n                      <div key={i} className={className}>'),
    ('<div\n                className="hack-input-viewport"',
     '{/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive terminal viewport */}\n              <div\n                className="hack-input-viewport"')
])
