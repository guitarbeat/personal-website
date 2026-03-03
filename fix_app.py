with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''  onScrollActivate,
  isInScroll,
  hideNavBar,
}: {
  navItems: any[];
  onMatrixActivate: () => void;
  onScrollActivate: () => void;
  isInScroll: boolean;
  hideNavBar: boolean;''',
'''  onScrollActivate: _onScrollActivate,
  isInScroll,
  hideNavBar,
}: {
  navItems: any[];
  onMatrixActivate: () => void;
  onScrollActivate: () => void;
  isInScroll: boolean;
  hideNavBar: boolean;'''
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
