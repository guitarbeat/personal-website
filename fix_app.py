import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix the lint errors
content = content.replace("onScrollActivate,", "onScrollActivate: _onScrollActivate,")
content = content.replace("onScrollActivate: _onScrollActivate: _onScrollActivate,", "onScrollActivate: _onScrollActivate,")

with open("src/App.tsx", "w") as f:
    f.write(content)
