import json

try:
    with open('/home/jules/pr_comments.json', 'r') as f:
        comments = json.load(f)
        for c in comments:
            print(f"Comment ID: {c.get('id')}")
            print(f"Body: {c.get('body')}")
            print(f"File Path: {c.get('path')}")
            print(f"Diff Hunk: {c.get('diff_hunk')}")
            print("-" * 20)
except FileNotFoundError:
    print("No comments file found.")
