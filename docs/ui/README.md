# UI handover — every page in the companion app

For the agent doing the visual pass. One file per route: what the page is for,
what is on it today, every state it can be in, and where it is weak.

**Read `../../CODE_RULES.md` and `../../PRODUCT.md` first.** They are binding and
they override anything here. This folder describes *what exists*; those two say
*what may be done to it*.

## The app in one paragraph

Sixteen managers run a Fantrax draft league. Fantrax is the source of truth for
the competition and is not going anywhere this season; this app republishes that
league with what Fantrax lacks — a phone-first score centre, a squad screen worth
opening, and a weekly paper. Everything below is read-only against two providers:
FPL for the real Premier League, Fantrax for our competition. **The app writes
nothing.**

## The pages

| Route | File | What it is |
|---|---|---|
| `/` | [gazetta.md](gazetta.md) | The week's paper. Lead, deals, doubts, next deadline. |
| `/league` | [league-table.md](league-table.md) | The table. Fantrax computes it. |
| `/league/schedule` | [league-schedule.md](league-schedule.md) | One gameweek, every competition on it. |
| `/league/matchups` | [league-matchups.md](league-matchups.md) | This period's head-to-heads, with live points. |
| `/league/matchups/[teamId]` | [matchup.md](matchup.md) | One head-to-head: two totals, and the eleven behind each. |
| `/squad` | [squads.md](squads.md) | Yours, then everyone else's. |
| `/squad/[teamId]` | [squad.md](squad.md) | **One squad. The reference page for the new look.** |
| `/matchday` | [matchday.md](matchday.md) | Live: your head-to-head, then the real football. |
| `/matchday/desk` | [desk.md](desk.md) | Every score in the league and the round, on one screen. |
| `/gw/[gameweek]` | [gameweek.md](gameweek.md) | Any round of football, addressable. |
| `/players` | [players.md](players.md) | The whole pool, sortable, filterable. |
| `/players/[fantraxId]` | [player.md](player.md) | One player's profile. |
| `/fpl` | [fpl.md](fpl.md) | The other game, kept small on purpose. |

Shared: [conventions.md](conventions.md) — tokens, components, the rules a
redesign must not break.

## Where the new visual direction lives

**`../../DESIGN.md` is binding and supersedes this section.** It holds the two
registers, the palette and the retirements; what follows describes the app as it
stood before the overhaul began and is kept for the geometry, which survives.

`/squad/[teamId]` was rebuilt most recently and is the reference: full-bleed
pitch on a gentle taper with sponsor hoardings, cut-out portraits standing on the
grass with nothing drawn behind them, a cream name plate and a band under it that
is his FDR fixture until he kicks off and his score after it, a pitch/list
toggle, and a tap-to-open player card. Pull the rest of the app toward it, not
the other way round.

## Four things that are not style

Break these and the app is wrong, however good it looks.

1. **The lineup gate.** Your own XI is yours all week; every *other* team's waits
   for its lineups to **lock** — fifteen minutes before the period's first
   kickoff, and NOT the period boundary, which is a different instant in 33 of
   this season's 38 weeks and was the bug `visibility.ts` was rewritten to fix.
   Squads are public throughout; before the lock the *arrangement* is not, and
   ordering, grouping, labels, pitch positions and anything crossing a
   `"use client"` boundary must not leak who starts.
2. **Provenance at the point of use.** Every number says whose it is. Fantrax's
   points are Fantrax's; a projection is labelled as a projection; FPL's scoring
   is labelled as FPL's. A number with no owner is the confident wrong answer.
3. **Absence is modelled, never defaulted.** A dash is not a nought. "We could
   not read it" and "it is zero" are different claims and the UI must keep them
   apart.
4. **Phone first.** One column, thumb-reachable, readable at arm's length.
   `min-h-11` is the standard touch target and the Pitch/List toggle is the one
   deliberate exception at `min-h-9` — on the head-to-head board and on a locked
   squad, the two screens that still draw an eleven two ways. Above `lg` the desk keeps its own
   proportions, because the rule is about a thumb and there is no thumb there:
   a row is 28px (`.cm-row`), a control 36, a column head 28 with its strip.
   PRODUCT.md carries why and `tools/ui/tapfit.mjs` measures it.
