# UI handover — every page in the companion app

For the agent doing the visual pass. One file per route: what the page is for,
what is on it today, every state it can be in, and where it is weak.

**Read `../rules/CODE_RULES.md` and `../rules/PRODUCT.md` first.** They are binding and
they override anything here. This folder describes *what exists*; those two say
*what may be done to it*.

## The app in one paragraph

Ten managers run a Fantrax draft league. Fantrax is the source of truth for
the competition and is not going anywhere this season; this app republishes that
league with what Fantrax lacks — a phone-first score centre, a squad screen worth
opening, and a weekly paper. Everything below is read-only against two providers:
FPL for the real Premier League, Fantrax for our competition. **The app writes
nothing.**

## The pages

| Route | File | What it is |
|---|---|---|
| `/` | [gazetta.md](gazetta.md) | The week's paper. Lead, deals, doubts, next deadline. |
| `/paper/{slug}` | [gazetta.md](gazetta.md) | One story, printed whole, under its standing head. |
| `/league` | [league-table.md](league-table.md) | The table. Fantrax computes it. |
| `/league/schedule` | [league-schedule.md](league-schedule.md) | One gameweek, every competition on it. |
| `/league/matchups` | [league-matchups.md](league-matchups.md) | This period's head-to-heads, with live points. |
| `/league/matchups/[teamId]` | [matchup.md](matchup.md) | One head-to-head: two totals, and the eleven behind each. |
| `/league/results` | [league-schedule.md](league-schedule.md) | The archive: every finished round, newest first. |
| `/league/team-stats` | [league-table.md](league-table.md) | The league ranked by one scoring category at a time. |
| `/league/cups` | [league-cups.md](league-cups.md) | Each cup's whole draw, round by round, before anyone is drawn. |
| `/prem` | [prem.md](prem.md) | **The real Premier League table, computed from finished fixtures.** |
| `/prem/results` | [prem.md](prem.md) | Every finished round of football, newest first. |
| `/prem/fixtures` | [prem.md](prem.md) | Every round still to come, soonest first. |
| `/prem/team-stats` | [prem.md](prem.md) | The twenty ranked by one measure at a time. |
| `/prem/club/[code]` | [prem.md](prem.md) | One club's squad, with the real position and Fantrax's eligibility side by side. |
| `/prem/club/[code]/set-pieces` | [prem.md](prem.md) | Who takes that club's penalties, free kicks and corners. |
| `/prem/club/[code]/fixtures` | [prem.md](prem.md) | That club's season, oldest first. Premier League only. |
| `/prem/club/[code]/stats` | [prem.md](prem.md) | Every player, by one group of measures, sortable. |
| `/prem/match/[id]` | [match.md](match.md) | One match: who scored, who assisted, who was booked, and whose they are. |
| `/prem/match/[id]/players` | [match.md](match.md) | Both team sheets, by FPL's bonus-points index. |
| `/squad` | [squads.md](squads.md) | Yours, then everyone else's. |
| `/squad/me` | [squad.md](squad.md) | **The front door.** The My Team section, which is the reader's own team under a URL rather than an id. |
| `/squad/[teamId]` | [squad.md](squad.md) | **One squad: the list and the pitch. The reference page for the new look.** |
| `/squad/[teamId]/transfers` | [squad.md](squad.md) | His business, in Championship Manager's ledger. |
| `/squad/[teamId]/next` | [squad.md](squad.md) | Who he plays, both sides on their own colours. |
| `/squad/[teamId]/fixtures` | [squad.md](squad.md) | His whole season, played and to come. |
| `/squad/[teamId]/stats` | [squad.md](squad.md) | Every man he owns, by scoring category, with the stats league's counts beneath each group. |
| `/matchday` | [matchday.md](matchday.md) | Live: your head-to-head, then the real football. |
| `/matchday/desk` | [desk.md](desk.md) | Every score in the league and the round, on one screen. |
| `/gw/[gameweek]` | [gameweek.md](gameweek.md) | Any round of football, addressable. |
| `/players` | [players.md](players.md) | **Data** — the whole pool, sortable, filterable, lit in ink. |
| `/players/analysis` | [analysis.md](analysis.md) | Compare: two players' figures, shots, key passes, touches and attributes, season or last 6. |
| `/players/teams` | [teams.md](teams.md) | Team Stats: the twenty clubs as a fantasy manager reads them, 13 measures in five groups. |
| `/players/projections` | [projections.md](projections.md) | Projections: the sister model's FPL-scoring points for the next six gameweeks, a scaffold. |
| `/players/planner` | [planner.md](planner.md) | The fixture planner: every club's next six opponents, ranked by our strength model. |
| `/players/[fantraxId]` | [player.md](player.md) | One player's profile. |
| `/fpl` | [fpl.md](fpl.md) | The other game, kept small on purpose. |

Shared: [conventions.md](conventions.md) — tokens, components, the rules a
redesign must not break.

## The template

A new section's doc starts from [TEMPLATE.md](TEMPLATE.md), which writes down
the shape every file here already has. It was reverse-engineered from `prem.md`
and `squad.md` for years before anybody wrote it down.

*This replaced a section headed "Where the new visual direction lives", which
opened by saying `docs/rules/DESIGN.md` superseded it and then described the app as it
stood before the overhaul. Twelve lines that told a reader to read something
else. Deleted 3 Sep 2026; docs/rules/DESIGN.md is binding and is linked at the top.*

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
4. **Phone first is the VIEWING CONDITION, not the design order** — and the two
   were one sentence until 31 Aug 2026, which is how a Championship Manager desk
   kept coming out as a phone screen with CM paint on it.

   **Design the desk first.** CM is an 800×600 design: its density, its
   two-column squad, its rail, its panel composition. None of that survives being
   derived from a phone, and every compromise on 31 Aug came from one component
   serving both, with the phone constraint winning each time. The desk layout is
   also the superset — it holds the whole information architecture, and the phone
   is a selection from it.

   **The phone is a second design of the same data, never a squeeze of the
   desk's.** That distinction is the whole point: "compromise from desktop" is
   precisely the process that produces cramped desk layouts on phones. Per
   screen, the desk decides WHAT is on it — the fields, the panels, the order of
   importance — and the phone then answers, independently, which of those a thumb
   at arm's length gets and in what one column. Subtraction of CONTENT by
   importance, not squeezing of LAYOUT.

   **Per screen, not per project.** Desk design and phone design in the same
   pass. Ten managers open this on phones on 10 Oct, and "the phone layouts
   are next" is how they end up being done in the last week.

   The split is in ARRANGEMENT only: one data join, one set of domain rules, one
   doc per screen, and the switch is CSS rather than a user-agent read
   (PLATFORM_NOTES, 31 Aug). Prefer `@container` where the constraint is really
   space — the squad list broke that afternoon because its COLUMN was 554px,
   which no viewport breakpoint could have known.

   What has NOT changed, and must not be confused with the above: One column,
   thumb-reachable, readable at arm's length.
   `min-h-11` is the standard touch target and the Pitch/List toggle is the one
   deliberate exception at `min-h-9` — on the head-to-head board and on a locked
   squad, the two screens that still draw an eleven two ways. Above `lg` the desk keeps its own
   proportions, because the rule is about a thumb and there is no thumb there:
   a row is 28px (`.cm-row`), a control 36, a column head 28 with its strip.
   docs/rules/PRODUCT.md carries why and `tools/ui/tapfit.mjs` measures it.
