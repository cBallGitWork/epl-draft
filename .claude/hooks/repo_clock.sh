#!/bin/bash
# Repo clock: what a session needs to know before it touches anything.
#   - how long until the league-id swap on 10 Oct, which is the only real deadline
#   - where this branch sits against origin, because more than one session commits
#     here and 24 unpushed commits have looked like a finished day before
#   - whether the daily capture is current (its history cannot be backfilled)
#   - the PRs waiting on Craig, and any tree whose work was left behind
#   - the dated one-offs, but only when one is within three days
#
# The one-offs are the reason this exists. Every other item on the plan can slip a
# day; these are appointments with a live season, and the two that have already
# been missed were missed by nobody looking at a calendar on the right morning.
#
# Emits SessionStart additionalContext when run as a hook; --print for humans.
# Cached because the statusline reads the same file every turn.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$PWD}"
cache="${TMPDIR:-/tmp}/epl_draft_repo_clock.txt"
ttl=600
mode="${1:-hook}"

# date | the last day it is worth doing | what it is
ONE_OFFS="2026-08-31|The flip-order sample, from ~21:00Z. /api/event-status/, /api/fixtures/?event=N and bootstrap data_checked sampled TOGETHER — GW1's chance was missed and this is the last easy one this month (PLATFORM_NOTES 'Two observations').
2026-09-10|One look at lineupLockType before period 4 locks. Its TYPE, not its value: if the commissioner's lock is really the period boundary, the whole lineup-window design is wrong.
2026-09-11|Period 4, the first gate-bite: the first period whose lock does NOT sit safely inside its gameweek. Watch it with /shoot and /probe.
2026-10-09|Period 6 opens. Swap eve — run /swap-day --dry-run today, not tomorrow.
2026-10-10|THE SWAP. FANTRAX_LEAGUE_ID in Vercel, the one place a league is set; CI asks production."

fresh=0
if [ -f "$cache" ]; then
  age=$(( $(date +%s) - $(stat -f %m "$cache" 2>/dev/null || echo 0) ))
  [ "$age" -lt "$ttl" ] && fresh=1
fi

if [ "$fresh" -eq 0 ]; then
  {
    today=$(date +%Y-%m-%d)
    today_s=$(date -j -f %Y-%m-%d "$today" +%s 2>/dev/null || echo 0)
    swap_s=$(date -j -f %Y-%m-%d "2026-10-10" +%s 2>/dev/null || echo 0)
    days=$(( (swap_s - today_s) / 86400 ))

    if [ "$days" -gt 0 ]; then
      printf 'Swap day (10 Oct, GW6) in %sd.\n' "$days"
    elif [ "$days" -eq 0 ]; then
      printf 'SWAP DAY IS TODAY. Run /swap-day.\n'
    else
      printf 'Season is live — swap day was %sd ago.\n' "$(( -days ))"
    fi

    # --- branch against origin ------------------------------------------------
    if [ -d "$root/.git" ]; then
      counts=$(cd "$root" && git rev-list --left-right --count '@{u}...HEAD' 2>/dev/null || echo "")
      branch=$(cd "$root" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
      if [ -n "$counts" ]; then
        behind=$(printf '%s' "$counts" | cut -f1)
        ahead=$(printf '%s' "$counts" | cut -f2)
        line="Branch ${branch}: ${ahead} ahead, ${behind} behind origin."
        [ "${ahead:-0}" -gt 0 ] && line="$line Nothing has left the machine — production is serving the ${ahead} commits back."
        [ "${behind:-0}" -gt 0 ] && line="$line Pull --rebase before capture or commit (never merge)."
        printf '%s\n' "$line"
      else
        printf 'Branch %s: no upstream.\n' "$branch"
      fi
      staged=$(cd "$root" && git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
      [ "${staged:-0}" -gt 0 ] && printf 'WARNING: %s path(s) already STAGED — another session may be mid-commit. Do not commit until you know they are yours.\n' "$staged"
    fi

    # --- work that has not landed ----------------------------------------------
    # Sessions cannot merge, so a finished PR waits on Craig; #124 sat four days fixed and unseen.
    prs=$(cd "$root" && gh pr list --state open --limit 100 --json number,createdAt \
      -q 'sort_by(.createdAt) | "\(length) \(.[0].number // "") \(.[0].createdAt[:10] // "")"' 2>/dev/null)
    if [ -n "$prs" ] && [ "${prs%% *}" -gt 0 ]; then
      read -r open oldest since <<< "$prs"
      since_s=$(date -j -f %Y-%m-%d "$since" +%s 2>/dev/null || echo "$today_s")
      printf 'PRs waiting to merge: %s, oldest #%s (%sd). Only Craig merges; say so if yours is among them.\n' \
        "$open" "$oldest" "$(( (today_s - since_s + 43200) / 86400 ))"
    fi
    # A tree idle six hours with uncommitted or unpushed work is stranded; a live session's is not.
    # A squash-merged branch's commits reach no remote, so a merged PR's branch counts only if dirty.
    MERGED=" $(cd "$root" && gh pr list --state merged --limit 300 --json headRefName -q '.[].headRefName' 2>/dev/null | tr '\n' ' ') "
    export MERGED
    stranded=$(cd "$root" && git worktree list --porcelain | awk '/^worktree /{print substr($0,10)}' |
      xargs -P 8 -I{} bash -c '
        wt="$1"; [ -d "$wt" ] || exit 0
        cutoff=$(( $(date +%s) - 21600 )); newest=0
        while IFS= read -r p; do
          m=$(stat -f %m "$wt/$p" 2>/dev/null || echo 0); [ "$m" -gt "$newest" ] && newest=$m
        done < <(git -C "$wt" status --porcelain 2>/dev/null | cut -c4- | grep -v "^\.playwright-mcp/")
        branch=$(git -C "$wt" rev-parse --abbrev-ref HEAD)
        ahead=$(git -C "$wt" rev-list --count HEAD --not --remotes 2>/dev/null || echo 0)
        case "$MERGED" in *" $branch "*) ahead=0 ;; esac
        [ "$ahead" -gt 0 ] && c=$(git -C "$wt" log -1 --format=%ct) && [ "$c" -gt "$newest" ] && newest=$c
        [ "$newest" -gt 0 ] && [ "$newest" -lt "$cutoff" ] &&
          printf "  %s (%s, idle since %s)\n" "$branch" "$wt" "$(date -r "$newest" "+%d %b %H:%M")"
        exit 0' _ {})
    [ -n "$stranded" ] && printf 'STRANDED — uncommitted or unpushed, untouched for 6h:\n%s\n' "$stranded"

    # --- capture freshness ----------------------------------------------------
    status=$(cd "$root" && npm run --silent capture:status 2>&1)
    if printf '%s' "$status" | grep -q 'OVERDUE'; then
      printf 'Capture OVERDUE:\n%s\n' "$(printf '%s' "$status" | grep -E 'OVERDUE|last capture' | sed 's/^/  /')"
    else
      printf 'Capture: %s\n' "$(printf '%s' "$status" | grep 'last capture' | tr '\n' ' ' | sed 's/  */ /g')"
    fi

    # --- intel freshness ------------------------------------------------------
    # intel-check's verdict line: the stale kinds with their ages, or that all are fresh.
    intel=$(cd "$root" && npm run --silent intel-check 2>&1)
    verdict=$(printf '%s' "$intel" | sed -n 's/^verdict: //p')
    printf 'Intel: %s\n' "${verdict:-intel-check gave no verdict. Run npm run intel-check.}"

    # --- dated one-offs, only when one is close -------------------------------
    due=""
    while IFS='|' read -r when what; do
      [ -z "$when" ] && continue
      when_s=$(date -j -f %Y-%m-%d "$when" +%s 2>/dev/null || echo 0)
      left=$(( (when_s - today_s) / 86400 ))
      if [ "$left" -ge 0 ] && [ "$left" -le 3 ]; then
        case "$left" in
          0) head="TODAY" ;;
          1) head="TOMORROW" ;;
          *) head="in ${left}d" ;;
        esac
        due="${due}  [${when}, ${head}] ${what}
"
      fi
    done <<< "$ONE_OFFS"
    [ -n "$due" ] && printf 'DATED — these do not wait:\n%s' "$due"
  } > "$cache" 2>/dev/null
fi

body=$(cat "$cache" 2>/dev/null)
[ -z "$body" ] && exit 0

if [ "$mode" = "--print" ]; then
  printf '%s\n' "$body"
  exit 0
fi

/usr/bin/jq -n --arg ctx "Repo clock (epl-draft-1):
${body}" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'
exit 0
