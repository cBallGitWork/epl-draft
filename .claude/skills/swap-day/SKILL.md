---
name: swap-day
description: The 10 Oct league-id swap runbook — the one Vercel value, the shape and bridge checks, the redeploy, and a smoke against the DEPLOYED url rather than localhost. Run on swap eve as --dry-run, and on the day for real.
argument-hint: "[--dry-run]"
disable-model-invocation: true
---

# Swap day — 10 Oct 2026, GW6

The app stops serving the rehearsal league and starts serving the real one.
`FANTRAX_LEAGUE_ID` = `mqsjd23smsgbiqzr`.

**With `--dry-run`, change nothing.** Read every value, print what each step
would set and what it is now, and report. That is the whole of swap eve.

## 1. One value, in Vercel

`FANTRAX_LEAGUE_ID` in the Vercel project's environment is the only place a
league is set. Nothing in the code names one, and CI keeps no copy: the paper's
job asks production which league it serves (`/api/league`) before every firing,
so it follows the redeploy by itself.

After the redeploy in step 3, confirm what production says:

```bash
curl -s https://epl-draft-companion.vercel.app/api/league   # {"leagueId":"mqsjd23smsgbiqzr"}
```

`FANTRAX_DEMO_TEAM_ID` may stay set: it lends a team only when that team is in
the served league, and a rehearsal team id names nobody in the real one.

## 2. Shape, then bridge

```bash
npm run shape-diff     # does the real league return what raw.ts claims?
npm run capture        # today's state of the league we are about to serve
npm run bridge         # regenerate the Fantrax→FPL mapping for the real pool
npm run bridge:check   # the unmapped gate
```

The real league has been refusing `getTeamRosters` with `NO_TEAMS` every day
until now — that stops today, and today is the first time much of this code has
seen a populated real league. Unmapped players are a gate, not a warning: an
unmapped man has no portrait, no fixtures and no scouting.

## 2b. The position minimums, which the real league has never answered for

```bash
npm run roster-limits     # needs FANTRAX_COOKIE; writes data/leagues/roster-limits.json
```

The fewest players a lineup may start at each position is a real commissioner
setting that **no Fantrax JSON endpoint carries** — it lives in the HTML of
`createLeague.go?goto=3`, and PLATFORM_NOTES has the probe. The real league's
copy of that page has no position table until the league has members, so the file
records it as `unreadable` and the planner enforces **no floor at all** for it.

That is the state the app ships in until this is run. It is not a broken screen —
the caps still hold and the XI still stays at eleven — but a manager could file a
back two on a screen that should have refused it, and Fantrax would reject the
lineup he thought he had planned.

Commit the regenerated file. If the real league's numbers differ from
dummy/rehearsal's D 3 · M 2 · F 1 · G 1, that is a finding and belongs in
PLATFORM_NOTES in the same commit.

## 3. Redeploy

Setting an environment variable does not rebuild. Trigger a deploy and wait for
it to finish before checking anything.

## 4. Smoke the DEPLOYED url, not localhost

```bash
SMOKE_BASE=https://<the-deployment> FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr npm run smoke
```

Localhost has its own `.env.local` and will pass while production serves the
rehearsal league. This is the step that distinguishes "I set the variable" from
"the world changed".

## 5. Look at the paper

Open `/` on the deployment and **read the screenshot**. The front page must print
prose. If the column is missing, step 1's second environment is where to look
first.

Then the canary: the real league's shape is not the rehearsal's, and the number of
teams, matchups and playoff rows is the fastest way to see which league is being
served.

## 6. Also on the list, and they are Craig's

- League renamed in Fantrax.
- `npm run team-codes` run once, sixteen codes distributed, `TEAM_CODES` set in
  the deployment. The codes are printed once and never stored.
- The three bridge review rows audited.

## Report

```
mode        --dry-run | LIVE
vercel      FANTRAX_LEAGUE_ID <was> → <now>
api/league  <what production answers after the redeploy>
shape-diff  <ok|drift: what>
capture     <n> reads recorded, <n> refused
bridge      <n> mapped / <n> pool · unmapped <n> <names if few>
deploy      <url> <status>
smoke       <url> <ok|fail>
front page  prose printed <yes|no> · roster limits <14/11/3 real | 15/11/5 rehearsal>
```
