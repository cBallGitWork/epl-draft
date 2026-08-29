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
| **Your own team** | `LineupPlanner` — XI on the pitch, bench under it, one target per player. See below. |
| A rival, his period open | `TeamSheet` — his eleven on the grass and his bench in a strip under it, read-only, with Fantrax's points and FPL's goals on each player, and every one of them opening the live card. The head-to-head board ([matchup.md](matchup.md)) draws the same component. |
| A rival, his period not open | `SquadBoard` — fifteen names, no arrangement. See below. |

**The gate is about rivals, not about you.** Your own lineup is visible to you
all week, because you are looking at it in Fantrax anyway and planning only
matters *before* the deadline. Every other team's waits for its period to open.
`teamDisplay(squads, mine)` answers for the one team on screen; the league-wide
`squads.display` stays a rival's answer and must, because things like the
matchups board's pending clean sheets read it for all sixteen at once.

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

The page refreshes at the live rate while the round is under way and at the idle
one otherwise — the same cadence as every other screen, because **the shell owns
the app's only poller** and the round is a fact about the shell. This page used
to mount its own, and so did seven others; `revalidate`
bounds how stale the cache may get and pushes nothing to a phone already open on
the sofa, so the score under fifteen faces sat still through a whole half.

## SquadBoard, in reading order

1. **View toggle** — `ViewToggle`, Pitch / List, plus a player count. `min-h-9`,
   the one deliberate exception to the `min-h-11` touch target. The same control
   in the same place once the period opens, so it does not move down the screen
   as the week turns.
2. **An explanation, only when something is off.** Three of the four gate reasons
   are *our* side failing to read something and are stated. The fourth,
   `not-started`, is the ordinary state of every squad most of every week and is
   deliberately silent — the header already says "squad", and a paragraph
   explaining the normal case cost the pitch a screenful on a phone.
3. **The pitch** (`SquadPitch`) or **the list** (`SquadRows`).
4. **A player card** (`PlayerCard`) over the top, when one is tapped — the "who
   is this" card, not the live one. There is no score to explain on a squad whose
   period has not opened.

### The pitch

- Full-bleed: it breaks out of the page gutters, because it is the widest thing
  in the app and the only one that gains from every pixel.
- Sponsor hoardings the width of the **far touchline** — not the page — carrying
  the league crest twice with the goal between them. They stand behind that goal
  line, so they are as wide as the pitch is at that depth; running them full
  width would put advertising on ground the perspective says is off the pitch.
  **That band is where a real sponsor goes.**
- Grass in perspective: a gentle splay (90% of the width at the goal line) as
  **one straight taper over the whole depth**. It was 78%, which is steeper than
  FPL's own app and cost the back line a fifth of its width — and the row padding
  is one figure for the whole column, so at that angle either the near rows gave
  up width they had or the far row stood off the pitch. It stood off the pitch.
  The inset is now the single number `FAR_INSET`, handed to the stylesheet by
  `PitchFrame`, and the row padding *is* that inset: every line stands inside the
  touchlines and none gives up a pixel to a line further back.

  An earlier version stopped splaying at 38% and ran square from there, which
  draws a touchline heading outward and then stopping dead halfway down — an eye still following the line
  reads the stop as the pitch turning back in. A perspective line has to keep
  going until it leaves the frame. Markings are at true proportions drawn at half
  scale, and drawn wider and shallower than true (`BOX_STRETCH`, `BOX_FLATTEN`):
  correctly proportioned at this scale the boxes come out as deep narrow slots,
  right on paper and wrong in a picture whose depth is already foreshortened.
  Penalty area, six-yard box, D, spot, corner arcs, halfway line, centre circle.
  **The touchlines are inset from the grass, not drawn on its edge** — there is
  always grass beyond a touchline, and a line on the edge of the picture reads as
  a border around a pitch rather than a line painted on one. They run off the
  near edge without closing, because that edge is a crop and not the end of a
  pitch.
- **The pitch has no ground of its own.** What lies outside the taper is the page
  background, as it is on FPL's. A second, darker green out there reads as a
  second surface, and the pitch stops being a thing sitting on the page and
  becomes a panel with a border.
- **All fifteen, no bench, no active/reserve mark.** A bench is a statement about
  who starts and this view may not make one. (The `TeamSheet` that renders once
  the gate is open does have one — the split is public by then, and it is the
  shape a reader came for.)
- Grouped by the position **the manager has him filling** (`slot.position`),
  never by what he is eligible for — Fantrax players routinely hold two.
- Sorted **by name within each line**, and that is load-bearing, not tidy. See
  the constraint below.
- Each player's bottom band **is** the fixture until he kicks off: the FDR colour
  fills the row edge to edge rather than sitting on it as a badge, and a double
  gameweek splits the row in two. Once he is on, the band flips dark and carries
  what he is worth — his points where we have a table, his minutes where we do
  not — with his goal/assist chips beside it. See
  [matchup.md](matchup.md#the-points-band).
- **One name size on every card, truncating.** It stepped down in three bands by
  length so a long name survived whole; that kept the words and lost the line —
  eleven cards in three type sizes read as eleven components, and the two men
  whose names had shrunk were the ones you could no longer scan. Craig's call,
  22 Aug, reversing the earlier one.
- **And the card shrinks, not the type.** That one size is `--text-2xs`, 11px, a
  declared step — the figure under it is `--text-xs` and the fixture and the
  chips are `--text-3xs`. It used to be `clamp(7px, 13cqw, 11px)`, a share of the
  card, which is the inversion that made this screen Craig's least favourite in
  the app: a line of seven took its width out of the name and printed it at seven
  pixels. Nothing in the clamp was reachable — an 11px name needed an 84.6px card
  and `MAX_CARD` was 69.6px — so the "range" only ever expressed its floor. Now a
  line too crowded to hold a name truncates it instead. There is no smaller thing
  to fall back to: FPL's `squad_number` is present on all 622 elements and null on
  every one of them, so the plate cannot print a number and does not pretend to.
- **Every card is the same width, on every line.** The basis comes from the
  fullest line in the set, so a back five and a front two draw the same card and
  a shorter line simply centres in the space. `MAX_CARD` is 110px, which is the
  width of the Premier League's own portrait file: the point at which a wider
  card would upscale the picture it exists to show. It was 4.35rem, which pinned
  every screen from about 768px up at 69.6px and a 9px name — so the desktop
  pitch was cap-starved where the phone is width-starved.
- **The photograph is drawn at the shape of the file it comes from** — 110×140,
  and FPL's kit fallback is 110×145 — **up to the height one row has room for**.
  The box was `1.32`, wider than it stood, which threw away three fifths of every
  asset and left a 33px face on a phone while a quarter of the screen under the
  pitch went unused. It is set on the card and not in the token layer, so the FPL
  tab's pitch and the paper's team of the week keep the head-only crop until
  somebody with those pages in hand says otherwise.
- **The card is bounded in both directions, and they come from opposite ends of
  the squad.** Width is a share of the fullest LINE, so a crowded line makes a
  narrow card. Height is a share of the screen divided by the number of ROWS,
  because that is what the pitch has to fit into — `.pitch-figure` in
  `globals.css`, against `--pitch-page`. Height had no bound at first and the
  omission bit immediately: card width is `f(widestLine)`, so *fewer* men in a
  line make a *wider* card, and once the figure carries an upright shape a wider
  card is a taller one. The 1-3-4-3 XI — four to a line, the slackest squad in
  the league — drew the tallest card of any of them and pushed this page 199px
  past the screen, while the seven-across squad that looks like the hard case sat
  comfortably inside it.
- **Two budgets, because this route is two pages.** The gated view spends 232px
  on furniture; the same route showing the owner's XI spends 382, because it
  carries a bench strip and a way out to Fantrax. Held to one number the
  fifteen-man pitch — the one this card was rebuilt for — gave up a third of its
  photograph to pay for a page it is not on, so `TeamSheet` and `LineupPitch`
  carry `.pitch-with-bench` and the gated pitch keeps the base.
- It fits a 390×844 phone with no scrolling. Keep it that way, and **measure the
  XI view as well as the gated one** — it is both the tighter page and the more
  visited, and it is the one a change breaks first. Measured 29 Aug, all four
  rehearsal squads, signed in: every one draws inside 844. The gated
  seven-across pitch takes 468px and the six-across ones 512px, with 144px and
  100px of the screen still in hand; the XI takes 428px with 53px in hand.
  That headroom is the margin against the next band somebody adds above the
  pitch — one appeared mid-change and cost 44px of it.

### The list

One line per player: crest, name, club, then either his FDR fixture chip or —
once he is on — what he has done and his minutes, and Fantrax's fantasy points. Headings spell the position out — "Goalkeepers", not "G" — which is a
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

## LineupPlanner — your own team

- **The XI on the pitch, the bench in a strip beneath it.** A rival's squad puts
  all fifteen on the grass because the active/reserve split is withheld there. On
  your own team that split is the decision being made, so it is the thing you are
  looking at.
- **One target per player, and the second tap is the second question.** Tap him
  once to pick him: he takes an accent ring and everyone he cannot legally change
  places with goes dim, so "who can come off for him" is the set still lit rather
  than a list to read. Tap him again for `MoveDialog` — everywhere else he can
  go, including the moves with no second player in them (off to the bench, across
  to another position). Every card used to carry a badge for that second
  question: fifteen permanent accent dots over the only thing on the screen worth
  looking at, to offer the move most taps are not after — while the second tap
  did nothing but put him back down, which closing the dialog already does.
- **Every rule is the commissioner's**, read from `getLeagueInfo` and applied by
  `moves.ts` in core: how many may start, how many may sit, the cap at each
  position, and which positions each player is eligible for. Nothing about the
  shape is assumed — a 1-5-2-3 is legal in this league and would be legal on
  screen.
- **Swaps are grouped by destination.** A full XI makes every position reachable
  only by a swap, which on a fifteen-man squad is fourteen buttons each repeating
  "Start at M for" in front of a name. Grouped, you pick the position once and
  read the names.
- **A position is never listed as blocked when a move above reaches it.** A full
  XI reports every position as `squad-full` while simultaneously offering swaps
  into it; the sheet used to say both.
- **It writes nothing.** The edited shape lives in browser state, the real roster
  is untouched, and the button at the bottom hands you to Fantrax. `violations()`
  reports what is already wrong — nothing the planner offers can create any of
  it, so anything listed arrived from Fantrax, usually a commissioner narrowing
  an eligibility under a lineup that was legal when it was set.

## Constraints

- **Ordering within a line must stay alphabetical.** Ordering by anything the
  roster carries restates the XI as an ordering. Fantrax happens to interleave
  actives and reserves in its payload, so rendering their order happens not to
  leak today — that is their serialisation detail, not a promise.
  `squadUnarranged()` sorts by name to make the non-leak a property of our code.
- No active/reserve treatment of any kind in this view: not a badge, not an
  opacity, not a position on the pitch.
- The planner is gated on `mine`, on the gate being open, and on `getLeagueInfo`
  having answered — one value (`planning`), so there is no arrangement of the
  three that opens a planner with no rules to enforce. It is **not** gated on the
  league being the rehearsal one any more: that check existed only to guard the
  `?preview=1` escape hatch, which existed only because the gate used to withhold
  your own lineup from you. The rule is narrower now — your own team always, every
  other team once its period opens — so there is nothing left to switch off.

## Known gaps

- **Your own squad has no list view, ever.** It renders `LineupPlanner` all week
  — your lineup is yours all week — and the planner's subject is the
  arrangement, which a list cannot express. Deliberate, but it does mean the one
  squad you look at most is the one you cannot read as rows.
- ~~**Future gameweeks are not browsable.**~~ `?gw=` works since 22 Aug, resolved
  through the calendar seam exactly as the head-to-head route resolves it, and
  the schedule's rows link into it — so tapping a side in a March fixture opens
  March's fifteen rather than this week's. The lineup gate still applies: a round
  whose period has not opened shows the squad and not the arrangement.
- ~~A line of seven leaves those names at the smallest step the plate allows.~~
  Solved 29 Aug, and not by wrapping — Craig was offered balanced rows and
  rejected them, so the recorded shrink-not-wrap rule stands. The line still
  gives up width; the type does not go with it any more. At seven across on a
  390px phone the card is 43.3px and the name is 11px, truncating; at seven
  across on a desk it is 110px and most names fit whole. Seven is still an
  autodrafted squad rather than anything a manager would pick, and it is now
  legible either way.
