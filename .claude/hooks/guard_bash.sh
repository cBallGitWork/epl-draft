#!/bin/bash
# PreToolUse guard for Bash.
# Four named foot-guns, each of which has actually fired in this tree, plus two
# that cost a session an hour. Nothing else: a guard that stops commands nobody
# regrets is a guard people learn to click through.
set -euo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | /usr/bin/jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

deny() {
  /usr/bin/jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}
ask() {
  /usr/bin/jq -n --arg r "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
  exit 0
}

# 1) git add -A / --all / bare `git add .` — more than one session commits in
#    this tree, and the index is shared process-wide.
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+add[[:space:]]+(-A|--all)([[:space:]]|$)'; then
  deny "git add -A sweeps whatever a parallel session has half-finished into your commit — this tree has had two sessions committing at once. Stage named paths only: git add path/one path/two."
fi
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+add[[:space:]]+\.([[:space:]]|$)'; then
  deny "'git add .' sweeps a parallel session's work and the untracked data captures into the index. Stage named paths only."
fi

# 2) git merge — the repo rebases. apps/companion/vercel.json now forces a
#    deploy on a merge rather than skipping one (it was skipping nine), so the
#    deploy is no longer the reason; the history is.
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+merge([[:space:]]|$)' \
   && ! printf '%s' "$cmd" | grep -qE 'git[[:space:]]+merge[[:space:]]+--abort'; then
  deny "This repo rebases and never merges. A merge commit makes HEAD^..HEAD mean the other branch, which is what apps/companion/vercel.json's ignoreCommand reads to decide whether to deploy. Use: git pull --rebase (or git rebase origin/main). 'git merge --abort' is allowed."
fi

# 3) git push --force in any spelling.
if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push[^;&|]*(--force[^[:space:]]*|-f)([[:space:]]|$)'; then
  deny "A force push rewrites what Vercel has already deployed and what the cron workflows commit into. If a rebase left the branch diverged, say so and let Craig decide."
fi

# 4) npm run capture — writes a dated directory that is the only record of that
#    day's league state. capture:status counts directories, so a capture run on
#    stale code looks identical to a healthy one afterwards.
if printf '%s' "$cmd" | grep -qE 'npm[[:space:]]+run[[:space:]]+capture([[:space:]]|$)'; then
  ask "Pull first. capture writes today's directory and it cannot be backfilled — and capture:status counts directories, so it cannot tell 'the cron stopped' from 'this tree never pulled the cron's commits'. Run: git pull --rebase, then capture."
fi

# 5) A second build/start/dev while one is already running. Next 16 keeps
#    .next/dev and .next/build apart, so dev + build is fine; two BUILDS are not,
#    and two servers means the second silently takes another port.
if printf '%s' "$cmd" | grep -qE 'npm[[:space:]]+run[[:space:]]+(build|start|dev)([[:space:]]|$)' \
   || printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])next[[:space:]]+(build|start|dev)([[:space:]]|$)'; then
  if pgrep -f 'next build' >/dev/null 2>&1; then
    ask "A 'next build' is already running in this tree. Two builds share one .next and clobber each other. Wait for it, or confirm you know it is finished."
  elif printf '%s' "$cmd" | grep -qE '(build)' && pgrep -f 'next-server' >/dev/null 2>&1; then
    exit 0   # dev server + a build is the normal case at Next 16.
  elif pgrep -f 'next-server' >/dev/null 2>&1; then
    ask "A Next server is already up on this tree (pgrep next-server). A second 'npm run dev/start' takes a different port and every tools/ui BASE_URL then points at the old one. Check http://localhost:3000 first."
  fi
fi

exit 0
