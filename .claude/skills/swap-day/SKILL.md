---
name: swap-day
description: The go-live runbook for Wed 7 Oct — the data the draft (Sat 3 Oct) must leave behind, the team codes, one Vercel change, the redeploy, a smoke against the DEPLOYED url, warm.yml, and a read of the front page. Run Tue 6 Oct as --dry-run, and on Wed 7 Oct for real.
argument-hint: "[--dry-run]"
disable-model-invocation: true
---

# Go live — Wed 7 Oct 2026

The app stops serving the rehearsal league and starts serving the real one,
`mqsjd23smsgbiqzr`. The real league drafts on Fantrax **Sat 3 Oct, 10:00 BST**;
the dry run is **Tue 6 Oct**; GW6, the first lineup lock, is **Sat 10 Oct, 12:15
BST (11:15 UTC)**. Ten teams.

**With `--dry-run`, change nothing.** Read every value, print what each step
would set and what it is now, and report. That is the whole of Tuesday.

## 1. After the draft (Sat 3 Oct), before anything else

The real league has answered `getLeagueInfo` and its position table all along;
from the draft on it has squads too. Each of these lands as a data PR off
`origin/main`, and none waits for Sunday's CI capture (05:10 UTC):

```bash
git pull --rebase
npm run capture        # the drafted league, today
npm run roster-limits  # needs FANTRAX_COOKIE; re-run because the squads now exist
npm run bridge         # regenerate the Fantrax→FPL mapping for the real pool
npm run bridge:check   # the unmapped gate; it only means something once there are squads
npm run shape-diff     # then update data/shape/baseline.json's getDraftResults and scoring
```

- Unmapped players are a gate, not a warning: an unmapped man has no portrait, no
  fixtures and no scouting.
- `getDraftResults`: `draftState` is `"completed"` and every pick carries a
  `playerId` (rounds × 10, the rounds read from `getLeagueInfo`).
- Probe period 5's rosters. If they are empty, a rival's squad page and the paper's
  owners are empty until the GW6 lock, and that is a fix before Wednesday.
- **Re-probe the cookie reads** on the real league: `getTeamRosterInfo` with
  `adminMode` on a team that is not Craig's, and a `confirm: true` dry run of
  `confirmOrExecuteTeamRosterChanges` on Craig's own team. Craig runs anything that
  could write. PLATFORM_NOTES (28 Sep, `adminMode` answered) has the bodies.
- **Monday's capture gate:** five fixtures in each of periods 6–38 and every team at
  0-0-0. Fewer means Fantrax's fixture list still needs regenerating for ten teams.

If the real league's position minimums differ from rehearsal's D 3 · M 2 · F 1 · G 1,
that is a finding and belongs in PLATFORM_NOTES in the same commit.

## 2. Team codes (Mon 5 – Tue 6 Oct)

```bash
SESSION_SECRET=<production's> FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr npm run team-codes
```

- The plain npm script reads `apps/companion/.env.local`, which names the dev
  league and the dev secret. The shell's values win over the file's.
- **Ten codes**, one per team, printed once and never stored. Craig distributes them.
- The secret must be the one production verifies with, or every code is refused.
- An old rehearsal cookie hides the code box, because `signedIn()` does not check
  the league. Rotate `SESSION_SECRET` with the new codes, or fix that first.

## 3. One Vercel change (Wed 7 Oct)

All four in the same change, because any data commit redeploys and a value set
early goes live early:

| Variable | Value |
|---|---|
| `FANTRAX_LEAGUE_ID` | `mqsjd23smsgbiqzr` |
| `TEAM_CODES` | step 2's line |
| `LINEUP_SAVE` | Craig's team id alone (`LINEUP_SAVE=<teamId,…>`), with `FANTRAX_COOKIE` set |
| `FANTRAX_DEMO_TEAM_ID` | **removed** |

- `LINEUP_SAVE=on` means every team may save; the allow-list form names the teams
  that may. Every other team sees the planner with no Save button.
- `FANTRAX_COOKIE` is the commissioner's session. Without it nothing saves,
  whatever `LINEUP_SAVE` says.
- Nothing in the code names a league, and CI keeps no copy: the paper's job asks
  production (`/api/league`) before every firing, so it follows the redeploy.

## 4. Redeploy, then ask production

Setting a variable does not rebuild. Trigger a deploy and wait for it.

```bash
curl -s https://epl-draft-companion.vercel.app/api/league   # {"leagueId":"mqsjd23smsgbiqzr"}
```

Rehearsal sign-ins stop working here, by design.

## 5. Smoke the DEPLOYED url, not localhost

```bash
SMOKE_BASE=https://<the-deployment> FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr npm run smoke
```

Localhost has its own `.env.local` and will pass while production serves the
rehearsal league. This step tells "I set the variable" from "the world changed".

## 6. Warm the pages

```bash
gh workflow run warm.yml
```

The cache keys carry the league id, so every entry is cold after the switch.

## 7. Look at the paper and the desk

Open `/` on the deployment and **read the screenshot**. A league with no stories
yet prints no column, so the test is that the page renders with the real league's
name and no refusal. Prose arrives with the first edition run (Wed 17:00 UTC);
check then that nothing about gameweek 5 filed.

Then the canary: ten teams and five matchups a gameweek. The squad size and bench
are read from `getLeagueInfo` after the draft (the bench was unsettled on 1 Oct),
and the position totals differ already: real D 6 · M 6 · F 4 · G 3 against
rehearsal's 5 · 5 · 3 · 2.

## 8. Also on the list, and they are Craig's

- The Actions budget on before Sun 4 Oct, 05:10 UTC; Anthropic auto-reload on before
  Wed 7 Oct, 17:00 UTC.
- The ten codes distributed.
- The bridge review rows audited.

## Report

```
mode         --dry-run | LIVE
draft        draftState <…> · picks <n> with playerId <n> · period-5 rosters <n> men
capture      <n> reads recorded, <n> refused · fixtures periods 6–38 <ok|short: which>
shape-diff   <ok|drift: what>
bridge       <n> mapped / <n> pool · unmapped <n> <names if few>
cookie reads roster-limits <ok> · adminMode read <ok> · dry run <ok|Craig's>
codes        <n> issued · secret matches production <yes|no>
vercel       FANTRAX_LEAGUE_ID <was> → <now> · TEAM_CODES · LINEUP_SAVE <value> · demo team <unset>
api/league   <what production answers after the redeploy>
deploy       <url> <status>
smoke        <url> <ok|fail>
warm         <run url> <ok|fail>
front page   renders <yes|no> · teams <n> · matchups a gameweek <n> · roster <read from getLeagueInfo>
```
