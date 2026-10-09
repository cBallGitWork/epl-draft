#!/bin/bash
# The deadline's bench order, from launchd at 07:00 London every day: bench-order.ts --wait --write on origin/main,
# holding the Mac awake (caffeinate -i) until five minutes before a lock due by 08:00 tomorrow. A run that reaches the
# write, or fails, reports to alert.yml as bench-order ok|fail; a day with no lock due logs one line. DRY_RUN=1 drops --write.
# launchd starts with a bare PATH; node comes from the newest nvm install. Then the token, before anything can fail.
NODE_BIN=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
export PATH="${NODE_BIN:+$NODE_BIN:}/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
GH_TOKEN=$(gh auth token --user cBallGitWork 2>/dev/null); export GH_TOKEN
set -uo pipefail

MAIN=${EPL_DRAFT:-$HOME/epl-draft-1}
WT=${BENCH_WORKTREE:-$HOME/epl-draft-bench}
REPO=cBallGitWork/epl-draft
LOG=${BENCH_LOG:-$HOME/Library/Logs/epl-draft-bench-order.log}
LOCK=$HOME/epl-draft-bench.lock

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M')" "$*" | tee -a "$LOG"; }
notify() { /usr/bin/osascript -e "display notification \"$1\" with title \"epl-draft bench order\"" >/dev/null 2>&1 || true; }
alert() {
  local try
  [ "${DRY_RUN:-0}" = 1 ] && { log "dry run: would alert bench-order $1: $2"; return 0; }
  for try in 1 2 3; do
    gh workflow run alert.yml -R "$REPO" --ref main -f source=bench-order -f state="$1" -f message="$2" >/dev/null 2>&1 && return 0
    [ "$try" = 3 ] || sleep 20
  done
  log "could not dispatch alert bench-order $1"
  notify "alert bench-order $1 never reached GitHub"
}
fail() { log "FAILED: $1"; notify "bench order failed: $1"; alert fail "$1"; exit 1; }

# One run at a time: a second the same day (a manual one, or launchd catching up after sleep) leaves the first to it.
if ! mkdir "$LOCK" 2>/dev/null; then
  holder=$(cat "$LOCK/pid" 2>/dev/null || true)
  if [ -n "$holder" ] && kill -0 "$holder" 2>/dev/null; then log "run $holder is already waiting; leaving it to that one"; exit 0; fi
  rm -rf "$LOCK" && mkdir "$LOCK" || fail "could not take $LOCK"
fi
echo $$ >"$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT

# The league the app serves, as CI asks production for it; FANTRAX_LEAGUE_ID in the environment overrides.
if [ -z "${FANTRAX_LEAGUE_ID:-}" ]; then
  base=$(gh variable get WARM_BASE_URL -R "$REPO" 2>/dev/null)
  FANTRAX_LEAGUE_ID=$(curl -sf --max-time 30 "$base/api/league" | /usr/bin/jq -r '.leagueId // empty')
fi
[ -n "${FANTRAX_LEAGUE_ID:-}" ] || fail "production named no league at /api/league"
export FANTRAX_LEAGUE_ID
[ -f "$MAIN/.env.local" ] || fail "$MAIN/.env.local is missing: it holds FANTRAX_COOKIE"

# A worktree on origin/main; the main folder is never touched.
for _ in 1 2 3 4 5; do git -C "$MAIN" fetch -q origin && break; sleep 30; done
[ -d "$WT" ] || git -C "$MAIN" worktree add -q --detach "$WT" origin/main || fail "worktree"
cd "$WT" && git checkout -q --detach origin/main && git reset -q --hard origin/main || fail "reset"
HASH=$(shasum package-lock.json | cut -c1-12)
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$HASH" ]; then
  npm ci --no-audit --no-fund >/dev/null 2>&1 || fail "npm ci"
  echo "$HASH" > node_modules/.lock-hash
fi

WRITE=--write
[ "${DRY_RUN:-0}" = 1 ] && WRITE=
OUT=$(mktemp)
caffeinate -i npx tsx --env-file="$MAIN/.env.local" scripts/bench-order.ts --wait $WRITE 2>&1 | tee -a "$LOG" >"$OUT"
status=${PIPESTATUS[0]}
last=$(tail -1 "$OUT")
rm -f "$OUT"
[ "$status" = 0 ] || fail "${last:-bench-order.ts exited $status}"
# Only a run that reached the teams reports ok; a day with no lock due is its one logged line.
if [[ $last =~ ^Period\ [0-9]+:\  ]]; then alert ok "$last"; notify "$last"; fi
exit 0
