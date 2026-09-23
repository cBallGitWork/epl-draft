#!/bin/bash
# Repo clock: what a session needs to know before it touches anything.
#   - how long until the league-id swap on 10 Oct, which is the only real deadline
#   - where this branch sits against origin, because more than one session commits
#     here and 24 unpushed commits have looked like a finished day before
#   - whether the daily capture is current (its history cannot be backfilled)
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
2026-10-10|THE SWAP. FANTRAX_LEAGUE_ID in Vercel *and* in .github/workflows/editions.yml, which inherits nothing from it."

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

    # --- capture freshness ----------------------------------------------------
    status=$(cd "$root" && npm run --silent capture:status 2>&1)
    if printf '%s' "$status" | grep -q 'OVERDUE'; then
      printf 'Capture OVERDUE:\n%s\n' "$(printf '%s' "$status" | grep -E 'OVERDUE|last capture' | sed 's/^/  /')"
    else
      printf 'Capture: %s\n' "$(printf '%s' "$status" | grep 'last capture' | tr '\n' ' ' | sed 's/  */ /g')"
    fi

    # --- intel freshness ------------------------------------------------------
    # Nothing in THIS repo can make the intel fresher: it is written by
    # `make export-epl-draft` in ~/ai-carling-premiership. So the clock says how
    # old it is, and says it loudest when the predicted eleven is for a round
    # that has already been played — which is not staleness but a wrong answer.
    # The check is skipped without a network; it is not worth a slow session
    # start, and `npm run intel-check` is always there to ask directly.
    intel=$(cd "$root" && npm run --silent intel-check 2>&1)
    if printf '%s' "$intel" | grep -q '✗'; then
      printf 'Intel needs attention:\n%s\n' "$(printf '%s' "$intel" | grep -E '✗|gameweek' | sed 's/^/  /')"
    elif printf '%s' "$intel" | grep -q 'no squads export'; then
      printf 'Intel: never exported — real positions, squad numbers and the predicted XI are all absent.\n'
    else
      printf 'Intel: %s\n' "$(printf '%s' "$intel" | grep -E 'squads:|xi:' | tr '\n' ' ' | sed 's/  */ /g')"
    fi

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
