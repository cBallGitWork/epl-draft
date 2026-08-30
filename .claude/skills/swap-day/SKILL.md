---
name: swap-day
description: The 10 Oct league-id swap runbook — both environments, the shape and bridge checks, the redeploy, and a smoke against the DEPLOYED url rather than localhost. Run on swap eve as --dry-run, and on the day for real.
argument-hint: "[--dry-run]"
disable-model-invocation: true
---

# Swap day — 10 Oct 2026, GW6

The app stops serving the rehearsal league and starts serving the real one.
`FANTRAX_LEAGUE_ID` = `ayyoh3n2mr326v2o`.

**With `--dry-run`, change nothing.** Read every value, print what each step
would set and what it is now, and report. That is the whole of swap eve.

## 1. Both environments. There are two, and one inherits nothing.

**Vercel** — the app's own environment variable. This is the one everybody
remembers.

**`.github/workflows/editions.yml`** — the column-writing job reads
`vars.FANTRAX_LEAGUE_ID`, a **repository variable**, and its job environment
inherits nothing from Vercel. Miss it and CI keeps filing a column about the
rehearsal league.

The failure is not silent but it is indirect: `PublishedEdition.leagueId` makes
the front page refuse to print a column about the wrong league. So the symptom is
a paper with no prose, not a paper about the wrong league — still a failure, and
one that looks like a bug in the paper.

```bash
gh variable list                       # what the workflow will read
gh variable set FANTRAX_LEAGUE_ID --body ayyoh3n2mr326v2o
```

Unset, it expands to `""` and falls back to the rehearsal league — not to a blank
id — so an empty value looks like a working app serving the wrong league.

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

## 3. Redeploy

Setting an environment variable does not rebuild. Trigger a deploy and wait for
it to finish before checking anything.

## 4. Smoke the DEPLOYED url, not localhost

```bash
SMOKE_BASE=https://<the-deployment> npm run smoke
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
actions     vars.FANTRAX_LEAGUE_ID <was> → <now>
shape-diff  <ok|drift: what>
capture     <n> reads recorded, <n> refused
bridge      <n> mapped / <n> pool · unmapped <n> <names if few>
deploy      <url> <status>
smoke       <url> <ok|fail>
front page  prose printed <yes|no> · league shape <15/11/5 real | 14/11/3 rehearsal>
```
