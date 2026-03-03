with open("src/components/content/Work/Work.tsx", "r") as f:
    content = f.read()

content = content.replace("work: any[];", "work: Job[];")
content = content.replace("((db?.work as any[]) || []).map((job)", "((db?.work as Job[]) || []).map((job: Job)")

with open("src/components/content/Work/Work.tsx", "w") as f:
    f.write(content)

with open("src/components/content/Projects/Projects.tsx", "r") as f:
    content = f.read()

content = content.replace("projects: any[];", "projects: Project[];")

with open("src/components/content/Projects/Projects.tsx", "w") as f:
    f.write(content)

with open("src/contexts/NotionContext.tsx", "r") as f:
    content = f.read()

content = content.replace("projects: any[];", "projects: any[]; // Using any to avoid circular dependencies temporarily")
content = content.replace("work: any[];", "work: any[];")
