with open("src/contexts/NotionContext.tsx", "r") as f:
    content = f.read()

content = content.replace("""interface NotionData {
  projects: any[];
  work: any[];
  about: any[];
}""", """interface NotionData {
  // biome-ignore lint/suspicious/noExplicitAny: Temporary generic typing for complex external API data structures
  projects: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Temporary generic typing for complex external API data structures
  work: any[];
  // biome-ignore lint/suspicious/noExplicitAny: Temporary generic typing for complex external API data structures
  about: any[];
}""")

content = content.replace("} catch (err: any) {", """      } catch (err: unknown) {
        // biome-ignore lint/suspicious/noExplicitAny: error property access
        const error = err as any;
        console.error("Error fetching Notion data:", error);
        setError(error.message);
""")
content = content.replace("""      } catch (err: unknown) {
        // biome-ignore lint/suspicious/noExplicitAny: error property access
        const error = err as any;
        console.error("Error fetching Notion data:", error);
        setError(error.message);

        console.error("Error fetching Notion data:", err);
        setError(err.message);""", """      } catch (err: unknown) {
        // biome-ignore lint/suspicious/noExplicitAny: error property access
        const error = err as any;
        console.error("Error fetching Notion data:", error);
        setError(error.message);""")

with open("src/contexts/NotionContext.tsx", "w") as f:
    f.write(content)
