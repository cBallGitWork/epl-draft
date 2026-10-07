#!/usr/bin/env bash
# One open issue per failing job, assigned to the owner, whom GitHub emails: `alert.sh <source> fail|ok "<message>"`.
# fail opens it, or comments when it has been quiet for QUIET_HOURS; ok closes it. Actions only, with GH_TOKEN set.
# The repo is public: a message is a run URL or a sentence, never a cookie or a token.
set -euo pipefail

REPO=cBallGitWork/epl-draft
OWNER=cBallGitWork
QUIET_HOURS=6

source=${1:-}
state=${2:-}
message=${3:-}
[[ $source =~ ^[a-z0-9-]+$ ]] || { echo "::error::alert source '$source' is not lowercase letters, digits and dashes"; exit 1; }
[[ $state == fail || $state == ok ]] || { echo "::error::alert state '$state' is not fail or ok"; exit 1; }
title="alert: $source"
# A backtick would close the fence; a token-shaped string is redacted in case a caller slips.
message=$(printf '%s' "$message" | tr '`' "'" | sed -E 's/(gh[pousr]_|github_pat_)[A-Za-z0-9_]+/[redacted]/g')
fence='```'
body=$(printf '%s\n\n%s\n%s\n%s\n' "$(date -u '+%Y-%m-%d %H:%M UTC')" "$fence" "${message:-no message}" "$fence")

# Without the label every create below fails.
gh label create alert -R "$REPO" --color b60205 --description "A job failed; scripts/ci/alert.sh opens and closes these" --force >/dev/null

# An exact title match: --search reads an index that lags behind a just-opened issue.
open=$(gh issue list -R "$REPO" --label alert --state open --limit 200 --json number,title,updatedAt |
  jq -r --arg title "$title" --argjson quiet "$((QUIET_HOURS * 3600))" \
    'map(select(.title == $title)) | first // empty | "\(.number) \(now - (.updatedAt | fromdateiso8601) > $quiet)"')
number=${open%% *}
quiet=${open#* }

if [ "$state" = ok ]; then
  if [ -n "$open" ]; then
    gh issue close "$number" -R "$REPO" --comment "$(printf 'Recovered.\n\n%s' "$body")" >/dev/null
    echo "closed #$number"
  fi
elif [ -z "$open" ]; then
  gh issue create -R "$REPO" --title "$title" --label alert --assignee "$OWNER" --body "$body"
elif [ "$quiet" = true ]; then
  gh issue comment "$number" -R "$REPO" --body "$(printf 'Still failing.\n\n%s' "$body")" >/dev/null
  echo "commented on #$number"
else
  echo "#$number is open and was updated within ${QUIET_HOURS}h; not commenting"
fi
