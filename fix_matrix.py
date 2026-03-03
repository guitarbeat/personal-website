with open('src/components/effects/Matrix/Matrix.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''                      {/* biome-ignore lint/suspicious/noArrayIndexKey: Log output uses index safely */}
                      <div key={i} className={className}>
                        {line}
                      </div>''',
'''                      // biome-ignore lint/suspicious/noArrayIndexKey: Log output uses index safely
                      <div key={i} className={className}>
                        {line}
                      </div>'''
)

with open('src/components/effects/Matrix/Matrix.tsx', 'w') as f:
    f.write(content)
