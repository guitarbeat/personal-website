import re

file_path = "src/components/content/Projects/Projects.test.tsx"

with open(file_path, "r") as f:
    content = f.read()

# We need to remove:
"""  const MOCK_PROJECTS = [
    {
      title: "Project One",
      slug: "project-one",
      date: "2024",
      keyword: "React",
      link: "https://example.com/react",
      content: "React project",
      image: null,
    },
    {
      title: "Project Two",
      slug: "project-two",
      date: "2023",
      keyword: "TypeScript, Jest",
      link: "https://example.com/ts",
      content: "TypeScript project",
      image: null,
    },
  ];"""

content = content.replace("""  const MOCK_PROJECTS = [
    {
      title: "Project One",
      slug: "project-one",
      date: "2024",
      keyword: "React",
      link: "https://example.com/react",
      content: "React project",
      image: null,
    },
    {
      title: "Project Two",
      slug: "project-two",
      date: "2023",
      keyword: "TypeScript, Jest",
      link: "https://example.com/ts",
      content: "TypeScript project",
      image: null,
    },
  ];""", "")

with open(file_path, "w") as f:
    f.write(content)
