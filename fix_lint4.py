with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("onScrollActivate: _onScrollActivate", "onScrollActivate: _onScrollActivate,")
content = content.replace("onScrollActivate: _onScrollActivate,,", "onScrollActivate: _onScrollActivate,")

with open("src/App.tsx", "w") as f:
    f.write(content)
