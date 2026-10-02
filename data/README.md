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
| `data/intel/` | the sister repo `~/ai-carling-premiership` (`make export-epl-draft`, by hand): squads, matches, set-pieces, touches, shots, strength, projections. By hand on 25 Sep: careers, depth. `scripts/scout-xi.ts` from `.github/workflows/scout-xi.yml`: xi. `scripts/ingest-pressers.ts` by hand: pressers | exports when someone runs them; xi every two hours when an eleven changes; pressers Thursday and Friday | the app: `apps/companion/app/intel.ts`, ten static imports (not pressers). Scripts: `scripts/intel.ts` for `scripts/edition/xi.ts`, `scripts/edition/pressers.ts`, `scripts/edition/predictions.ts`, `scripts/scout-xi.ts`; `scripts/intel-check.ts` | yes |
| `data/mappings/` | `scripts/build-bridge.ts` (`fantrax.json`, `fantrax-aliases.json`, `review/`) and `scripts/pl-bridge.ts` (`premierleague.json`), by hand, then audited | the bridge when the pool changes; pl-bridge after a round | the app: `apps/companion/app/squads.ts`, `apps/companion/app/plFeed.ts`. Scripts: `scripts/bridge-check.ts`, `scripts/edition/facts.ts`, `scripts/edition/predictions.ts`; `scripts/build-bridge.ts` re-reads its own two files | yes |
| `data/leagues/` | by hand: `recorded.json`, `venues.json`. `scripts/roster-limits.ts` with `FANTRAX_COOKIE`: `roster-limits.json` | when a recorded league changes; roster limits after the draft; venues when a photograph lands | `recorded.json`: scripts only, through `scripts/leagues.ts`, and `.github/workflows/verify.yml`. `roster-limits.json`: the app, `apps/companion/app/rosterMinimums.ts`. `venues.json`: the app, `apps/companion/app/venues.ts` | yes |
| `data/shape/` | by hand: `baseline.json`, the shape differences someone has read and accepted | when a difference is accepted | `scripts/shape-diff.ts` | yes |

## Home venues

`leagues/venues.json` gives each team in the real league a home ground, keyed by its Fantrax team
id (`team` is a label for people; nothing reads it). A head-to-head is drawn over the home side's
venue, home being the side Fantrax's schedule lists as home. Every entry points at the desk's own
photograph, `/ground/crowd.jpg`, until a real one lands, and a team the file does not list gets the
same. The real league had nine teams on 1 Oct; a team that joins later needs a line, and its id is
in `getLeagueInfo`'s teams.

To give a team its own ground:

1. Put the photograph in `apps/companion/public/ground/venues/`: landscape, 1400px wide or more,
   capped at 1920px on the long edge at JPEG quality 75, as the clubs' grounds are.
2. Point the team's `src` at it: `"src": "/ground/venues/<file>.jpg"`.
3. Optionally add `"blur"`, the same picture 16px wide as a `data:image/jpeg;base64,…` URL
   (`sips -Z 16 <file>.jpg --out /tmp/b.jpg && base64 -i /tmp/b.jpg` on a Mac). It paints while the
   photograph loads; without it the screen is dark for that moment.
4. A photograph that is not your own needs its credit on `/credits` (author, licence, source), as
   every ground there has: add it in `apps/companion/app/credits/page.tsx`.

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
