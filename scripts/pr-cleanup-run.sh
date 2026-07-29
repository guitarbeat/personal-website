#!/usr/bin/env bash
# Process PR cleanup: merge winners, close the rest.
set -euo pipefail
REPO="guitarbeat/personal-website"
LOG="docs/pr-cleanup-log.md"
WINNERS_FILE="docs/pr-cleanup-winners.json"

cd "$(dirname "$0")/.."

merge_nums=$(jq -r '.merge[].number' "$WINNERS_FILE")
declare -A MERGE_SET
for n in $merge_nums; do MERGE_SET[$n]=1; done

# Build winner lookup for close comments
declare -A CLUSTER_WINNER
while IFS= read -r line; do
  cluster=$(echo "$line" | jq -r '.cluster')
  num=$(echo "$line" | jq -r '.number')
  CLUSTER_WINNER[$cluster]=$num
done < <(jq -c '.merge[]' "$WINNERS_FILE")

echo "# PR Cleanup Log" > "$LOG"
echo "" >> "$LOG"
echo "Started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG"
echo "" >> "$LOG"
echo "## Merged" >> "$LOG"
echo "" >> "$LOG"

merge_ok=0
merge_fail=0

for entry in $(jq -c '.merge[]' "$WINNERS_FILE"); do
  num=$(echo "$entry" | jq -r '.number')
  reason=$(echo "$entry" | jq -r '.reason')
  echo "Merging #$num: $reason"
  if gh pr merge "$num" --squash --delete-branch --repo "$REPO" 2>/dev/null; then
    echo "- **#$num** merged (squash): $reason" >> "$LOG"
    merge_ok=$((merge_ok + 1))
  else
    echo "- **#$num** MERGE FAILED: $reason" >> "$LOG"
    merge_fail=$((merge_fail + 1))
  fi
  sleep 1
done

echo "" >> "$LOG"
echo "## Closed" >> "$LOG"
echo "" >> "$LOG"

open_prs=$(gh pr list --state open --limit 200 --json number,title,headRefName,mergeable --jq '.[] | @base64')
close_ok=0
close_fail=0

for row in $open_prs; do
  pr=$(echo "$row" | base64 --decode)
  num=$(echo "$pr" | jq -r '.number')
  title=$(echo "$pr" | jq -r '.title')
  branch=$(echo "$pr" | jq -r '.headRefName')
  mergeable=$(echo "$pr" | jq -r '.mergeable')

  if [[ -n "${MERGE_SET[$num]:-}" ]]; then
    continue
  fi

  # Determine close reason from inventory cluster
  cluster=$(jq -r --arg n "$num" '.prs[] | select(.number == ($n|tonumber)) | .cluster' docs/pr-cleanup-inventory.json 2>/dev/null || echo "misc")
  winner="${CLUSTER_WINNER[$cluster]:-}"

  if [[ -n "$winner" ]]; then
    comment="Closing as part of PR cleanup. Duplicate or superseded by #$winner."
  elif [[ "$mergeable" == "CONFLICTING" ]]; then
    comment="Closing as part of PR cleanup. Branch has merge conflicts with main and is not the chosen implementation."
  else
    comment="Closing as part of PR cleanup. Change does not provide sufficient value relative to maintenance cost or overlaps with merged work."
  fi

  echo "Closing #$num ($title)"
  if gh pr close "$num" --comment "$comment" --repo "$REPO" 2>/dev/null; then
    # Delete branch if still exists
    gh api -X DELETE "repos/$REPO/git/refs/heads/$branch" 2>/dev/null || true
    echo "- **#$num** closed ($branch): $comment" >> "$LOG"
    close_ok=$((close_ok + 1))
  else
    echo "- **#$num** CLOSE FAILED" >> "$LOG"
    close_fail=$((close_fail + 1))
  fi
  sleep 0.5
done

echo "" >> "$LOG"
echo "## Summary" >> "$LOG"
echo "" >> "$LOG"
echo "- Merged: $merge_ok (failed: $merge_fail)" >> "$LOG"
echo "- Closed: $close_ok (failed: $close_fail)" >> "$LOG"
echo "- Finished: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG"

echo "Done. Merged=$merge_ok failed=$merge_fail Closed=$close_ok failed=$close_fail"
