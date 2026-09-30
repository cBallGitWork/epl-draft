#!/usr/bin/env bash
# Commit what the caller staged and push it to main, rebasing over whatever the other crons pushed meanwhile.
#
#   scripts/ci/push.sh "<commit message>" "<what to say when nothing is staged>"
#
# Needs GITHUB_TOKEN in the environment: checkout runs with persist-credentials: false, so no
# earlier step (npm ci, a script) ever holds a token that can push. Rebase, never merge: Vercel's
# ignoreCommand reads HEAD^..HEAD. Five tries with jitter, because four workflows push to one branch.
set -euo pipefail

message="$1"
nothing="${2:-Nothing to commit.}"

if git diff --cached --quiet; then
  echo "$nothing"
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
fi
git commit -m "$message"

rebase_open() {
  [ -d "$(git rev-parse --git-path rebase-merge)" ] || [ -d "$(git rev-parse --git-path rebase-apply)" ]
}

for attempt in 1 2 3 4 5; do
  if git pull --rebase --autostash && git push; then
    exit 0
  fi
  # A conflict left open fails every retry, and retrying cannot heal it.
  if rebase_open; then
    conflicts=$(git diff --name-only --diff-filter=U | paste -sd ' ' -)
    git rebase --abort
    echo "::error::the rebase onto origin conflicted in ${conflicts:-an unlisted path}; aborted, nothing pushed"
    exit 1
  fi
  echo "push attempt ${attempt} lost a race; retrying"
  # PUSH_BACKOFF_SCALE=0 skips the wait, for the tests.
  sleep $(( (attempt * 5 + RANDOM % 10) * ${PUSH_BACKOFF_SCALE:-1} ))
done
echo "::error::could not push after 5 attempts"
exit 1
