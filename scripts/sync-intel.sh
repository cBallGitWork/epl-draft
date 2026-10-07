#!/bin/bash
# The Mac's half of the week: the sister repo's exports into a PR that merges once CI passes.
#   sync-intel.sh weekly    Tuesday, the round settled: every sister file and the cup fixtures
#   sync-intel.sh pressers  Thursday and Friday: the press conferences, squads and depth
# Works in its own worktree, never the main folder. DRY_RUN=1 stops before the push.
set -euo pipefail

MODE=${1:?usage: sync-intel.sh weekly|pressers}
MAIN=${EPL_DRAFT:-$HOME/epl-draft-1}
WT=${INTEL_WORKTREE:-$HOME/epl-draft-intel}
SISTER=${SISTER_REPO:-$HOME/ai-carling-premiership}
REPO=cBallGitWork/epl-draft
LOG=${INTEL_LOG:-$HOME/Library/Logs/epl-draft-intel.log}
# launchd starts with a bare PATH; node comes from the newest nvm install.
NODE_BIN=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
export PATH="${NODE_BIN:+$NODE_BIN:}/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

log() { printf '%s %s %s\n' "$(date '+%Y-%m-%d %H:%M')" "$MODE" "$*" | tee -a "$LOG"; }
notify() { /usr/bin/osascript -e "display notification \"$1\" with title \"epl-draft intel\"" >/dev/null 2>&1 || true; }
fail() { log "FAILED: $1"; notify "$MODE failed: $1"; exit 1; }

case "$MODE" in
  weekly) KINDS="squads set-pieces strength depth matches lines shots touches" ;;
  pressers) KINDS="squads depth" ;;
  *) fail "unknown mode $MODE" ;;
esac

# A fresh worktree on origin/main; the main folder is never touched.
git -C "$MAIN" fetch -q origin || fail "fetch"
[ -d "$WT" ] || git -C "$MAIN" worktree add -q --detach "$WT" origin/main || fail "worktree"
cd "$WT"
git checkout -q --detach origin/main && git reset -q --hard origin/main && git clean -fdq data/intel || fail "reset"
LOCK=$(shasum package-lock.json | cut -c1-12)
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$LOCK" ]; then
  npm ci --no-audit --no-fund >/dev/null 2>&1 || fail "npm ci"
  echo "$LOCK" > node_modules/.lock-hash
fi

# Projections only while the Data tab shows them (PROJECTIONS_SHOWN in players/routes.ts).
grep -q "PROJECTIONS_SHOWN = true" apps/companion/app/players/routes.ts && KINDS="$KINDS projections"

# The sister export writes every kind; take only this mode's. It exits 1 on carried complaints.
OUT=$(mktemp -d)
(cd "$SISTER" && ./.venv/bin/python scripts/export/epl_draft_intel.py --out "$OUT" >"$OUT/export.log" 2>&1) || true
for kind in $KINDS; do
  for file in "$OUT/$kind"/*.json; do
    [ -f "$file" ] && cp "$file" "data/intel/$kind/$(basename "$file")"
  done
done
if [ "$MODE" = weekly ]; then
  SISTER_REPO="$SISTER" npm run -s intel-cups >/dev/null 2>&1 || log "intel-cups refused; cups left as they were"
else
  # Scout's day archives around the next deadline, then yesterday's and today's conferences (a day re-run replaces itself).
  (cd "$SISTER" && ./.venv/bin/python scripts/ingest/ingest_ffscout_daily.py >"$OUT/ffscout.log" 2>&1) || log "the Scout scrape refused"
  for day in "$(date -v-1d +%Y-%m-%d)" "$(date +%Y-%m-%d)"; do
    npx tsx scripts/ingest-pressers.ts "$day" >/dev/null 2>&1 || log "no conferences ingested for $day"
  done
fi

# A file whose only change is its manifest (a new exportedAt) is not a change.
for file in $(git status --porcelain data/intel | awk '$1 == "M" {print $2}'); do
  if [ "$(git show "HEAD:$file" | /usr/bin/jq -S -c 'del(.manifest)' | shasum)" = "$(/usr/bin/jq -S -c 'del(.manifest)' "$file" | shasum)" ]; then
    git checkout -q -- "$file"
  fi
done

CHANGED=$(git status --porcelain data/intel | awk '{print $2}' | tr '\n' ' ')
[ -n "$CHANGED" ] || { log "nothing changed"; exit 0; }
log "changed: $CHANGED"

npm test >/dev/null 2>&1 || fail "tests"
npm run -s typecheck >/dev/null 2>&1 || fail "typecheck"
npm run -s lint >/dev/null 2>&1 || fail "lint"
npm run -s build >/dev/null 2>&1 || fail "build"
npm run -s intel-check >>"$LOG" 2>&1 || true
[ "${DRY_RUN:-0}" = 1 ] && { log "dry run: gates green, stopping before the push"; exit 0; }

DAY=$(date +%Y-%m-%d)
BRANCH="chore/intel-$MODE-$DAY"
TITLE="chore: the sister repo's $MODE intel, $DAY"
git switch -q -c "$BRANCH"
git add data/intel
git commit -q -m "$TITLE" -m "Written by scripts/sync-intel.sh $MODE on Craig's Mac: $CHANGED" || fail "commit"
TOKEN=$(gh auth token --user cBallGitWork) || fail "gh token"
git push -q "https://x-access-token:$TOKEN@github.com/$REPO.git" "$BRANCH" || fail "push"
export GH_TOKEN=$TOKEN
gh pr create -R "$REPO" --base main --head "$BRANCH" --label chore --label intel --title "$TITLE" \
  --body "Written by \`scripts/sync-intel.sh $MODE\` on Craig's Mac. Changed: $CHANGED. Four gates green before the push; it merges itself once CI's verify passes." >/dev/null || fail "pr"

state=""
for _ in $(seq 1 60); do
  state=$(gh run list -R "$REPO" --workflow verify.yml --branch "$BRANCH" --limit 1 --json status,conclusion --jq '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null || true)
  case "$state" in completed*) break ;; esac
  sleep 20
done
[ "$state" = "completed success" ] || fail "CI said '$state'; PR left open"
gh pr merge -R "$REPO" --squash --delete-branch "$BRANCH" >/dev/null || fail "merge"
git checkout -q --detach origin/main
log "merged $BRANCH"
notify "$MODE intel merged"
