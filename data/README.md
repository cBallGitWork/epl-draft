# data

Checked into git on purpose. This is the season's permanent record, and git is both its audit
trail and its only backup. Where every source comes from, and what notices when it goes stale, is
[`docs/providers/README.md`](../docs/providers/README.md).

## Who writes what

`apps/companion/vercel.json`'s `ignoreCommand` skips a deploy when a commit touches nothing outside
`data/snapshots` and `data/probes`; any other change under `data/` redeploys the app, and a merge
commit always builds. The app reads `data/` only by static import, so a file it reads reaches a
phone only through a deploy.

| Directory | Written by | How often | Read by | A commit there redeploys? |
|---|---|---|---|---|
| `data/snapshots/` | `scripts/capture-fantrax.ts`, from `.github/workflows/capture.yml` or by hand after a pull | daily at 05:10 UTC | scripts only: `scripts/capture-status.ts`, `scripts/build-bridge.ts` (newest pool), `scripts/period-alignment.ts` (newest `getLeagueInfo`) | no |
| `data/probes/` | by hand, one dated directory per probe; `data/probes/round-state/` is a closed record (sampling stopped 1 Oct 2026) | by hand | people; nothing in code | no |
| `data/ratings/` | `scripts/ratings.ts`, from `.github/workflows/ratings.yml`; GW1–GW5 by hand on 1 Oct 2026 | after each settled match day | the app: `apps/companion/app/ratings.ts` (`26-27.json`), on the player profile and Data | yes |
| `data/editions/` | `scripts/write-edition.ts` through `scripts/edition/persist.ts`, from `.github/workflows/editions.yml` | whenever the newsdesk files a story | the app: `apps/companion/app/paper.ts` (`paper.json`). The writer re-reads `ledger.json` and `archive/<leagueId>/` | yes |
| `data/intel/` | `scripts/sync-intel.sh` on Craig's Mac (launchd), from the sister repo's export of what its GitHub sweep wrote: squads, matches, set-pieces, touches, shots, strength, depth, lines, projections; cups by `scripts/intel-cups.ts`, careers by `scripts/intel-careers.ts`, league projections by `scripts/draft-pack.ts` with a dated copy a week in `data/intel/league-projections/weekly/`; pressers by `scripts/ingest-pressers.ts`. `scripts/scout-xi.ts` from `.github/workflows/scout-xi.yml`: xi. `scripts/stats.ts` from `.github/workflows/ingest-stats.yml`: stats | weekly Tuesday 08:00 London; pressers, squads and depth Thursday 16:00 and Friday 12:30, 16:00 and 17:45; xi every two hours Thursday to Saturday and daily otherwise, when an eleven changes; stats daily | the app: `apps/companion/app/intel.ts`, ten static imports (not pressers). Scripts: `scripts/intel.ts` for `scripts/edition/xi.ts`, `scripts/edition/pressers.ts`, `scripts/edition/predictions.ts`, `scripts/scout-xi.ts`; `scripts/intel-check.ts` | yes |
| `data/mappings/` | `scripts/build-bridge.ts` (`fantrax.json`, `fantrax-aliases.json`, `review/`) and `scripts/pl-bridge.ts` (`premierleague.json`), by hand, then audited | the bridge when the pool changes; pl-bridge after a round | the app: `apps/companion/app/squads.ts`, `apps/companion/app/plFeed.ts`. Scripts: `scripts/bridge-check.ts`, `scripts/edition/facts.ts`, `scripts/edition/predictions.ts`; `scripts/build-bridge.ts` re-reads its own two files | yes |
| `data/leagues/` | by hand: `recorded.json`. `scripts/roster-limits.ts` with `FANTRAX_COOKIE`: `roster-limits.json` | when a recorded league changes; roster limits after the draft | `recorded.json`: scripts, through `scripts/leagues.ts`, and `.github/workflows/verify.yml`; the app reads its `stats` and `scoring` roles (`assistKinds.ts`, `scoring.ts`). `roster-limits.json`: the app, `apps/companion/app/rosterMinimums.ts` | yes |
| `data/shape/` | by hand: `baseline.json`, the shape differences someone has read and accepted | when a difference is accepted | `scripts/shape-diff.ts` | yes |

## The snapshots

```
snapshots/fantrax/
  leagues/<key>/YYYY-MM-DD/     one directory per recorded league per London day
    getLeagueInfo.json          raw fxea responses, verbatim
    getTeamRosters.json
    getStandings.json
    getDraftResults.json
    getTransactionDetailsHistory-{CLAIM_DROP,TRADE,LINEUP_CHANGE}.json   fxpa, one per view
    manifest.json               capturedAt, leagueId, per-read ok/error
  pool/YYYY-MM-DD/              the EPL player pool, once per day
    getPlayerIds.json
    manifest.json               same shape; leagueId is null
```

`<key>` is a league's `key` in `data/leagues/recorded.json`: `real`, `dummy` and `rehearsal` today.
Renaming a key moves data. The pool sits outside the leagues because `getPlayerIds` takes no
league id and answers the same for every league.

**Why capture at all.** Fantrax serves current state. It will not say in March who was benched in
October, and nothing else archives a private league, so a day not captured is a day gone. The
transaction log is captured as well because it is the one part of our history Fantrax could prune
and nothing else can rebuild.

**Cadence.** The capture runs daily. `npm run capture:status` allows an undrafted league seven
days and a drafted one a day, and exits non-zero when any is overdue.

**Raw in, raw out.** A capture writes exactly what the provider returned and derives nothing: what
we can ask later is limited by what we kept.

## Home venues

`leagues/venues.json` gives each team in the real league a home ground, keyed by its Fantrax team
id (`team` is a label for people; nothing reads it). It is written by hand and read by the app
(`apps/companion/app/venues.ts`), so a change to it redeploys. A head-to-head is drawn over the
home side's venue, home being the side Fantrax's schedule lists as home. A team with no photograph
of its own points at the desk's, `/ground/crowd.jpg`, and a team the file does not list gets the
same. The real league has ten teams, all listed; a team that joins later needs a line, and its id
is in `getLeagueInfo`'s teams.

To give a team its own ground:

1. Put the photograph in `apps/companion/public/ground/venues/`: landscape, 1400px wide or more,
   capped at 1920px on the long edge at JPEG quality 75, as the clubs' grounds are.
2. Point the team's `src` at it: `"src": "/ground/venues/<file>.jpg"`.
3. Optionally add `"blur"`, the same picture 16px wide as a `data:image/jpeg;base64,…` URL
   (`sips -Z 16 <file>.jpg --out /tmp/b.jpg && base64 -i /tmp/b.jpg` on a Mac). It paints while the
   photograph loads; without it the screen is dark for that moment.
4. Give it a `credit`: `place` (what `/credits` calls it), and the Commons file's `title`, `author`,
   `licence`, `licenceUrl` and `source`. `/credits` prints it, and a test fails a picture under
   `ground/venues/` without one. A public-domain file's `licenceUrl` is the CC public domain mark.
