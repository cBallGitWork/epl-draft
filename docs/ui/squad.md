# `/squad/[teamId]` — one manager's squad

**The reference page for the current visual direction.** Rebuilt 19 Aug 2026.

## Who opens it and why

Mostly somebody else's squad: the matchup card, the standings and the squad list
all lead here. The questions are "who has he got", "who does he play this week",
and "is that man fit". The page knows whose squad it is (`mine`) and says so in
the title.

## Three different pages behind one route

| When | What renders |
|---|---|
| Period open (`display.show === "lineup"`) | `Pitch` — the XI and the reserves, with live goals/minutes on each sticker. |
| Period not open (`display.show === "squad"`) | `SquadBoard` — **the new work**, described below. |
| Your own squad, rehearsal league, `?preview=1` | `LineupPlanner` — drag-free lineup planning that writes nothing. Never for a rival's team, never for the real league. |

## How the data reaches the view

The page joins the squad **on the server**, once, with `squadDetail()` in core:
each roster slot arrives at the board already carrying its club, its fixtures for
the round, and its points. The three views never look anything up.

That is worth keeping. Before it, the pitch, the list and the card each asked the
same two questions of the same two maps, which meant shipping every club in the
league and every fixture in the round to a phone so fifteen players could look
two of them up. `squadDetail` is pure and tested; if a fourth view appears, give
it a `SquadPlayerDetail` rather than the maps.

`SquadPlayerDetail.points` has **three** states and they are not
interchangeable: `undefined` (no table at all — the column disappears), `null`
(the table answered and does not name him — a dash), or a number.

## SquadBoard, in reading order

1. **View toggle** — Pitch / List, plus a player count. `min-h-9`, the one
   deliberate exception to the `min-h-11` touch target.
2. **An explanation, only when something is off.** Three of the four gate reasons
   are *our* side failing to read something and are stated. The fourth,
   `not-started`, is the ordinary state of every squad most of every week and is
   deliberately silent — the header already says "squad", and a paragraph
   explaining the normal case cost the pitch a screenful on a phone.
3. **The pitch** (`SquadPitch`) or **the list** (`SquadRows`).
4. **A player card** (`PlayerCard`) over the top, when one is tapped.

### The pitch

- Full-bleed: it breaks out of the page gutters, because it is the widest thing
  in the app and the only one that gains from every pixel.
- Sponsor hoardings the width of the **far touchline** — not the page — carrying
  the league crest twice with the goal between them. They stand behind that goal
  line, so they are as wide as the pitch is at that depth; running them full
  width would put advertising on ground the perspective says is off the pitch.
  **That band is where a real sponsor goes.**
- Grass in perspective. The splay is gentle (78% of the width at the goal line)
  and **finishes at 38% of the depth**, square-sided from there down — a
  trapezoid that keeps opening all the way spends its widest, most useful rows
  off the edge of the grass. Markings are at true proportions drawn at half
  scale: penalty area (widened a quarter beyond its true share, or it reads as a
  slot rather than a box), six-yard box, D, spot, corner arcs, and a halfway line
  with the centre circle three quarters down. Half scale because a correct
  full-size box swallows the top third of the frame; FPL draw theirs small for
  the same reason. **No outline around the pitch** — the grass already has an
  edge, and a stroke tracing it reads as a border around a picture of a pitch.
- **All fifteen, no bench, no active/reserve mark.** A bench is a statement about
  who starts and this view may not make one.
- Grouped by the position **the manager has him filling** (`slot.position`),
  never by what he is eligible for — Fantrax players routinely hold two.
- Sorted **by name within each line**, and that is load-bearing, not tidy. See
  the constraint below.
- Each sticker's bottom strip **is** the fixture: the FDR colour fills the row
  edge to edge rather than sitting on it as a badge, and a double gameweek splits
  the row in two. Once he is on, the strip goes back to the black keyline with
  his minutes and his goal/assist chips on it.
- Names step down in size rather than truncating — "JOÃO PEDRO" is two different
  players on some rosters, so an ellipsis is the wrong trade on a squad screen.
- It fits a 390×844 phone with no scrolling. Keep it that way.

### The list

One line per player: crest, name, club, FDR fixture chip, and Fantrax's fantasy
points. Headings spell the position out — "Goalkeepers", not "G" — which is a
**documented exception** to never translating Fantrax's vocabulary, because
`getLeagueInfo` publishes the letters and no long names at all. A letter the map
has never seen prints verbatim, so the rule survives where it matters. The points
column heading reads **"Proj"** rather than "FPts" when Fantrax answered with a
projection — which it does unless the year-to-date code is both known and
honoured. The column vanishes entirely when Fantrax would not answer; it never
fills with noughts.

### The card

A native `<dialog>`, so Escape, the focus trap and the inert background are the
browser's. Its subject is the same sticker at album size — tapping a sticker to
be shown a plainer portrait would look like a different player. Carries the
fixture and kickoff, FPL's fitness note when there is one, why a slot is
unresolved when it is, and a way out to the full profile.

## Constraints

- **Ordering within a line must stay alphabetical.** `squadInLines()` lifts the
  actives to the front of every line, which is the XI restated as an ordering.
  Fantrax happens to interleave actives and reserves in its payload, so rendering
  their order happens not to leak today — that is their serialisation detail, not
  a promise. `squadUnarranged()` sorts by name to make the non-leak a property of
  our code.
- No active/reserve treatment of any kind in this view: not a badge, not an
  opacity, not a position on the pitch.
- The planner is gated on `mine` **and** on the league being the rehearsal one.
  Leaking sixteen lineups before a deadline is the one mistake that cannot be
  taken back.

## Known gaps

- **Future gameweeks are not browsable.** The view takes fixtures for whatever
  round the snapshot holds; a `?gw=` selector needs a snapshot fetched for that
  round *and* `getTeamRosters` asked for the matching period.
- A seven-man line wraps to a second row and the pitch looks lopsided.
