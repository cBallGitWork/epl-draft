---
paths:
  - "packages/core/src/league/fantrax/**"
  - "scripts/**"
---

# Fantrax rules (loaded because you are in the adapter or a script)

## Score the roster slot, never a position off the player

Fantrax's scoring is position-dependent (`G: {D:6, M:5, F:4}`, `CS: {D:4, M:1}`)
and the position applied is **the slot his manager chose**. Dozens of players are
eligible at two — `getLeagueInfo.playerInfo` carries `eligiblePos` like `"F,M"` —
and `getPlayerIds`' one letter per man is the global pool's default, never the
league's answer.

Saka is `F,M`, filed at M: `getLiveScoringStats` pays him 8 at midfield rates
while `getPlayerStats` pays him 6 at forward rates. So the pool table's `FPts` is
**not** what a player scored for his owner.

## Count, do not quote

Every population number in the docs was true on the day it was written and has
moved since — the element count tracks the transfer window, the pool was 759 in
early August and 671 three weeks later, `rotowireId` is on about four players in
five and the denominator moves too. **Read the length; never assert the number.**

A row's presence is not a claim about the player: after a round's first kickoff
`/api/event/{gw}/live/` has a row for **every** player in the league, most of
them on nought minutes.

And before building on a field, count its non-nulls. `squad_number` is present as
a key on every element and null as a value on all of them — a fallback was
designed on top of it. A field that is always null is not a field.

## Never name-match at runtime

The Fantrax→FPL bridge is built once by `npm run bridge`, audited by hand, and
persisted in `data/mappings/fantrax.json`. Runtime reads the file.

## Secrets from the environment only

Never a literal, never a checked-in file, never a log line. Two scripts read a
secret from the environment and both only run in CI (`write-edition` needs
`ANTHROPIC_API_KEY` and `FANTRAX_LEAGUE_ID`). **Scripts load no env file unless
their npm script passes `--env-file`,** and exactly one does: `team-codes`, which
reads `apps/companion/.env.local` because the secret it mints with must be the
one the app verifies with.

`FANTRAX_LEAGUE_ID` selects the league the app serves and defaults to the
rehearsal league.

## Writes are confirm-then-execute, flagged, and audited

No fire-and-forget on an undocumented endpoint. The write client allow-lists the
single roster method, because the same cookie reaches `deleteLeague`.
