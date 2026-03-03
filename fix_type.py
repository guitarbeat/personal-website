with open("src/utils/shopUtils.ts", "r") as f:
    content = f.read()

content = content.replace("export const handlePrintfulError = (", "export const handlePrintfulError = (")

with open("src/utils/shopUtils.ts", "w") as f:
    f.write(content)
