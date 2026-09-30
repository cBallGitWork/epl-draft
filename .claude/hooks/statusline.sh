#!/bin/bash
# Statusline: the things that change under you while you work.
# Reads the cache repo_clock.sh maintains and refreshes it only when stale, so
# the per-turn cost is a file read and one curl with a tenth-of-a-second budget.
set -uo pipefail

input=$(cat 2>/dev/null || true)
root="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$root" ]; then
  root=$(printf '%s' "$input" | /usr/bin/jq -r '.workspace.project_dir // .workspace.current_dir // .cwd // empty' 2>/dev/null)
fi
[ -z "$root" ] && root="$PWD"

cache="${TMPDIR:-/tmp}/epl_draft_repo_clock.txt"
if [ ! -f "$cache" ] || [ $(( $(date +%s) - $(stat -f %m "$cache" 2>/dev/null || echo 0) )) -ge 600 ]; then
  CLAUDE_PROJECT_DIR="$root" "$root/.claude/hooks/repo_clock.sh" --print >/dev/null 2>&1
fi

swap=$(grep -o 'in [0-9]*d\.' "$cache" 2>/dev/null | head -1 | tr -d '.')
[ -z "$swap" ] && swap="swap ?" || swap="swap $swap"
grep -q 'SWAP DAY IS TODAY' "$cache" 2>/dev/null && swap="SWAP DAY"

branch=$(cd "$root" 2>/dev/null && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
counts=$(cd "$root" 2>/dev/null && git rev-list --left-right --count '@{u}...HEAD' 2>/dev/null || echo "")
if [ -n "$counts" ]; then
  behind=$(printf '%s' "$counts" | cut -f1)
  ahead=$(printf '%s' "$counts" | cut -f2)
  pos="${branch} +${ahead}/-${behind}"
else
  pos="${branch} (no upstream)"
fi

if grep -q 'Capture OVERDUE' "$cache" 2>/dev/null; then
  cap="capture OVERDUE"
else
  cap="capture fresh"
fi

# What waits on Craig: open PRs, and trees left with work nobody committed or pushed.
queue="$(grep -o 'PRs waiting to merge: [0-9]*' "$cache" 2>/dev/null | grep -o '[0-9]*$' || echo 0) PRs to merge"
stranded=$(sed -n '/^STRANDED/,/^[^ ]/p' "$cache" 2>/dev/null | grep -c '^  ')
[ "${stranded:-0}" -gt 0 ] && queue="$queue, ${stranded} STRANDED"

if curl -sf -o /dev/null --max-time 1 http://localhost:3000/ 2>/dev/null; then
  app=":3000 up"
else
  app=":3000 down"
fi

printf '%s | %s | %s | %s | %s\n' "$swap" "$pos" "$queue" "$cap" "$app"
