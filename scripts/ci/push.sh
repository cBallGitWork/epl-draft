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

for attempt in 1 2 3 4 5; do
  if git pull --rebase --autostash && git push; then
    exit 0
  fi
  echo "push attempt ${attempt} lost a race; retrying"
  sleep $(( attempt * 5 + RANDOM % 10 ))
done
echo "::error::could not push after 5 attempts"
exit 1
