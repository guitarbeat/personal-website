with open("src/components/effects/Matrix/useMatrixRain.ts", "r") as f:
    content = f.read()

content = content.replace("""    // biome-ignore lint/suspicious/noExplicitAny: Navigator extension properties
    const isSlowDevice =""", """    const isSlowDevice =""")

with open("src/components/effects/Matrix/useMatrixRain.ts", "w") as f:
    f.write(content)
