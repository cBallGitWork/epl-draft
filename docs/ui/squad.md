# `/squad/[teamId]` — one manager's squad

**The reference page for the current visual direction.** Rebuilt 19 Aug 2026.

## Who opens it and why

Mostly somebody else's squad: the matchup card, the standings and the squad list
all lead here. The questions are "who has he got", "who does he play this week",
and "is that man fit". The page knows whose squad it is (`mine`) and says so in
the title.

## The front door — `/squad/me`

**The My Team section's front door** (Craig, 21 Sep 2026); its plate reads
`Team`, which is what fits at 320. `me` is a segment this route
accepts in place of an id and resolves against the rostered teams; a reader who
is not signed in is sent to `/squad`, where the code goes in. `squad/routes.ts`
carries the constants and the reason it is a URL rather than a redirect: the
rail is a client component and the id is in a signed HTTP-only cookie, so a
plate pointing at `/squad/<your id>` would mean `cookies()` above every route in
the app — the paper going dynamic to light a nav plate.

Two things follow, and both are in `team.ts`:

- **`whoseTeam(slug, teams)` is the one resolver**, extracted at three — this
  page, the Match tab and `leagueTeams` each read their own roster and each had
  to answer it. It returns the id AND whether it is the reader's, because both
  callers that want the second want it against the list they resolved from.
- **`TeamIdentity.slug` is what the URL said**, and the tab strip builds its five
  hrefs from it rather than from the id. A manager who came in through My Team
  therefore stays inside `/squad/me/*` across Transfers, Match, Fixtures and
  Stats, and the plate stays lit. Following the id instead would drop him onto
  the same screens under a pathname the rail no longer recognises.

  **The door is not the only way in, and the other ways do not light it.** The
  league table, Team Stats, the matchup sides and the schedule all link a team by
  id, including when that team is yours — so your own squad has two pathnames and
  only one of them marks the rail. The index's own row goes through the door;
  the rest are unconverted and it is a deliberate open question rather than an
  oversight.

The section owns exactly `/squad/me` and not the `/squad` prefix, so a rival's
squad never lights a plate that says My Team.

## Three different pages behind one route

| When | What renders |
|---|---|
| **Your own team, the open week** | `LineupPlanner` — XI on the pitch, bench under it, one target per player. See below. |
| Your own team, any other week | `TeamSheet`, read-only, as a rival's locked one. See the gameweek picker below. |
| A rival, his period open | `TeamSheet` — his eleven on the grass and his bench in a strip under it, read-only, with Fantrax's points and FPL's goals on each player, and every one of them opening the live card. The head-to-head board ([matchup.md](matchup.md)) draws the same component. |
| A rival, his period not open | `SquadBoard` — fifteen names, no arrangement. See below. |

**The gate is about rivals, not about you.** Your own lineup is visible to you
all week, because you are looking at it in Fantrax anyway and planning only
matters *before* the deadline. Every other team's waits for its period to open.
`teamDisplay(squads, mine)` answers for the one team on screen; the league-wide
`squads.display` stays a rival's answer and must, because things like the
matchups board's pending clean sheets read it for all ten at once.

## The gameweek picker

Craig, 1 Oct 2026: *"lets have a gameweek dropdown like fantrax does, shows their opp for that week (and
previous week would show their score)"*. `GameweekPicker` sits beside the Pitch/List toggle on every branch
(alone at the right above `lg`) and sets `?gw=`. Its options are the league's own calendar, one per period
(`readCalendar`, from `getLeagueInfo`'s periods), never FPL's gameweek list; the real league's starts at
Gameweek 6. `weekStanding` (`weeks.ts`, tested) says where the week on screen stands against the open one:

| Week | Your own | Each man shows |
|---|---|---|
| Locked (played or in play) | read-only `Sheet` | his score that week, on the grass and under FPts |
| Open | `LineupPlanner`, the only week Save touches | his opponent; FPts is the season |
| Ahead | read-only `Sheet` | his opponent; no FPts column, because Fantrax answers a future week with noughts |

A rival's weeks follow the gate as before: locked weeks draw his sheet, the open and later ones his squad.
A change made with an unsaved lineup goes through `LeaveGuard`'s prompt like any link.

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

**It is a list, and there is no pitch on it** (Craig, 31 Aug). This board draws
FIFTEEN with no arrangement, because the arrangement is what the gate withholds —
and a pitch is a drawing of a shape, so fifteen men in position lines is a
diagram of something nobody picked. Championship Manager's own squad screen is a
table for the same reason (`cm9900/25.jpg`). `SquadPitch` was deleted with the
toggle that switched to it; the eleven that IS a shape keeps its pitch on the
head-to-head and the planner, and `### The pitch` below describes those two and
no longer describes this one.

1. **A player count**, and nothing else on that line. There is no view to choose
   between any more.
2. **An explanation, only when something is off.** Three of the four gate reasons
   are *our* side failing to read something and are stated. The fourth,
   `not-started`, is the ordinary state of every squad most of every week and is
   deliberately silent — the header already says "squad", and a paragraph
   explaining the normal case cost the pitch a screenful on a phone.
3. **The list** (`SquadRows`) — all fifteen, alphabetical inside each position
   group, which is the order the gate requires.
4. **The season grid** (`SeasonGrid`) — a second bevelled panel per scoring
   group, under the board. A CM screen is two to four panels laid out together
   and this one was already paid for: `squadSeason` reads the whole `TeamStats`
   to price the board and used to drop thirteen keeper columns, eleven outfield
   ones, `perGame` and Fantrax's own name for the season on the floor. Every
   figure is theirs, re-rendered by their `FPTS` view as the points that category
   contributed; the header is read from the league rather than listed, because
   the real league scores five categories the rehearsal one does not. Stacked
   under the board and never above it — seventeen columns and a pitch both want
   the width, and a band above the pitch comes out of the pitch's own budget.
   Its rows are dense (~25px) and legitimately so: nothing in the table is a
   control, and `min-h-11` is a rule about what a thumb has to hit.
   **Above `lg` the two panels stand side by side.** Championship Manager's own
   content area is 710px of an 800px canvas and a 1440 screen less the rail is
   1310, so one panel up there is not a CM screen scaled up — it is a CM screen
   with half of it missing. `minmax(0,1fr)` on the single column below `lg` as
   well as on the pair above it: a grid item's default `min-width: auto` is its
   content's min-content width, so without it the seventeen columns widened the
   whole page and laid a 390 phone out at 627.
5. **A player card** (`PlayerCard`) over the top, when one is tapped — the "who
   is this" card, not the live one. There is no score to explain on a squad whose
   period has not opened.

### The pitch

*Superseded 21 Sep 2026: every pitch now stands on `CmGround`'s flat diagram, and
`PitchFrame` and `PitchTurf` are gone. Kept as the record of the perspective pitch.*

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
  declared step — the figure and the fixture under it are `--text-xs` (the fixture
  was `--text-3xs` until 30 Sep 2026, cream on the page ground at 15.5:1 and still
  unreadable at arm's length at 9px), and the chips are `--text-3xs`. It used to be `clamp(7px, 13cqw, 11px)`, a share of the
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
- **The KIT is drawn at the shape of the CROPPED kit** — very nearly square — **up to the
  height one row has room for**. Not the file's 110×145, and not the jersey's own
  shape either: counted off the alpha channel on 10 Sep 2026, the shirt inside
  the 220×290 canvas is 193×284 for an outfield kit and 207×283 for a keeper's,
  which is **0.680** wide-to-tall against about 0.88 on the sites Craig put
  beside it. Ours is a photographed full-length jersey and theirs is a stubbier
  illustration, so the hem is cropped — `KEPT` in `PlayerShirt`, with the card's
  shape computed from it (`CARD = JERSEY / KEPT`) rather than written out
  anywhere. It was 0.80 for one round and is 0.70 now (Craig, 10 Sep 2026: *"the
  shirts still seem long, so we could kinda cut them off to make them more
  square"*). The box was `1.32`, wider than it
  stood, which threw away three fifths of every asset and left a 33px face on a
  phone while a quarter of the screen under the pitch went unused.

  Since 10 Sep 2026 the shape is set by `PlayerShirt` on its own root rather than
  by each card, because every pitch now draws the same asset and a caller that
  forgot to declare it letterboxed a portrait kit inside `1.32`'s landscape
  default — 63px of shirt in a 110px card. The variable is set on the element
  that reads it, which is the only arrangement in which no caller can get it
  wrong.

  The card's height cap and its aspect-ratio can still disagree on a short
  viewport, so the kit shares an INNER box that takes the
  card's height and derives its width from the ratio. That box is the shirt, so
  the crop stays a crop at every viewport instead of quietly becoming a
  letterbox.
- **The card is bounded in both directions, and they come from opposite ends of
  the squad.** Width is a share of the fullest LINE, so a crowded line makes a
  narrow card. Height is a share of the screen divided by the number of ROWS,
  because that is what the pitch has to fit into — `.pitch-figure` in
  `pitch.css`, against `--pitch-page`. Height had no bound at first and the
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
- **The PITCH fits a 390×844 phone with no scrolling** — that is the invariant,
  and it was "the page fits" until the season grid landed under the board on 31
  Aug 2026. The page scrolls now, deliberately: the pitch ends at 553px on a 390
  phone and the second panel starts at 565, so a reader sees the whole squad and
  the head of the grid before touching anything. What must not happen is the
  pitch running past the fold. Keep it that way, and **measure the
  XI view as well as the gated one** — it is both the tighter page and the more
  visited, and it is the one a change breaks first. Measured 29 Aug, all four
  rehearsal squads, signed in: every one draws inside 844. The gated
  seven-across pitch takes 468px and the six-across ones 512px, with 144px and
  100px of the screen still in hand; the XI takes 428px with 53px in hand.
  That headroom is the margin against the next band somebody adds above the
  pitch — one appeared mid-change and cost 44px of it.
- **`node tools/ui/pitchfit.mjs` is how this is checked, and typing the answer
  in here is how it went wrong.** Every number in this bullet was written by hand
  on 29 and 31 Aug and every one of them was stale within a day — the rail, the
  re-decided `--pitch-page` and a formation line above the grass each moved them.
  The instrument walks every squad the served league has at 390, 768, 1024 and
  1440 and prints where the grass ends against the fold; it exits non-zero if any
  of them runs past it. The figures above (232/382 of furniture, 468/512/428 of
  pitch, 53px in hand) are August's, are superseded, and are kept only because
  they are what a dated record is for. On 31 Aug the tightest of sixteen readings
  was **100px clear**, at 768.

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
- **Save lineup writes it to Fantrax** (Craig, 30 Sep 2026: "needs a save button ... make the save button
  obvious, and a 'do you want to save' if you leave the screen"). The royal-blue primary plate under the pitch,
  with Reset beside it, appears once anything has moved and is disabled while a rule is broken. `saveLineup`
  (`squad/[teamId]/save.ts`) names the team from the signed code (never the lent demo team) and the week from
  `planningRound()`, refuses a page planned for another week and anything inside `SAVE_MARGIN_MINUTES` of the
  lock, re-checks the league's rules, then sends Fantrax's dry run and saves only on a clean `CONFIRM`. It runs
  only for a team `LINEUP_SAVE` allows (`on`, or a list of team ids) with `FANTRAX_COOKIE` set; elsewhere the bar reads
  "Planned, not saved" and the Fantrax link is the way to submit. Each write logs one `lineup-save` line.
- **The bench order is yours to set on the pitch.** Tap one sub, then another, and they swap places; the
  numbers 1–4 are the order they come on. It starts from Fantrax's `autoSubOrderMap` and saves with
  `setAutoSubsOrder`.
- **Leaving with unsaved changes asks first**: "Save and leave", "Leave without saving" or "Stay" on a tap to
  another screen, and the browser's own prompt on a reload or close. The back button is not caught.
- `violations()` reports what is already wrong — nothing the planner offers can create any of it, so anything
  listed arrived from Fantrax, usually a commissioner narrowing an eligibility under a lineup that was legal
  when it was set.

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

## The five tabs — a team is a spine, not a page

Added 2 Sep 2026. `cm9900/25.jpg` runs `Squad · Transfers · Next Match ·
Fixtures · Finances & Info` across the top of Everton and `cm0102/07.jpg` runs
the identical set two releases later, so this is the reference's own shape
rather than one invented here. Ours drops the finances, which a fantasy team
does not have, and spends the slot on Stats.

`squad/[teamId]/Shell.tsx` is the frame all five wear: the team's title bar in
his own colour and the strip. No caption box since 23 Sep 2026: it repeated the
lit tab. It also sets `--cm-index` once, so
every index block on every tab runs in that manager's colour rather than the
league's deep blue.

**The League strip is not replaced, because it was never here.** `/squad` has
never rendered `SectionNav`; the rail is the only thing that has ever marked
this section, and it goes on doing it — `owns()` prefix-matches `/squad/`.

| Tab | Route | What it is | Where the data comes from |
|---|---|---|---|
| Squad | `/squad/[teamId]` | The list and the pitch, side by side on the desk | the rosters read this page already makes |
| Transfers | `…/transfers` | His business, as `cm0102/23.jpg`'s ledger: one row a deal, a With column only once he has traded | `readDeals`, filtered to him — the same feed the paper's business column reads |
| Match | `…/next` | Who he plays, both sides on their own colours (`21.jpg`) | `headToHead`, already on the page |
| Fixtures | `…/fixtures` | The whole season, played and to come | `seasonRows` + `Season`, imported from `/league/schedule` rather than copied |
| Stats | `…/stats` | Every man he owns, filtered by category | `getPlayerStats` filtered on `ownerTeamId`, off a warm cache; the stats league's season beneath each group (`statsLeague.ts`); DefCon points of ours on Scoring, off its periods |

**Three of the four cost no new request.** That is why they are tabs and not a
later phase: the reads were already being made and were being thrown away.

**A tab with nothing behind it greys and stays put** (`.cm-out`, its first
consumer after three sightings in the reference). `cm0102/07.jpg` greys an
unavailable `Training` rather than hiding it: a strip that loses a plate has
moved every plate after it, and a reader who tapped Transfers yesterday would
find Fixtures where it was.

**Which round a tab shows is not one question.** Your own squad opens on the
PLANNING round, because a planner is about the week you can still change.
Everybody else's opens on the last LOCKED round — the most recent week with a
visible arrangement — because the planning week is precisely the one the gate
withholds, and pointing a rival's screen there meant the pitch was never once
visible from an ordinary tap. Mid-round the two coincide, which is what a reader
wants on a Saturday. `?gw=` still wins over both.

## Known gaps

- ~~**Your own squad has no list view, ever.**~~ Overruled by Craig, 2 Sep 2026:
  "my squad will have list view, change, old rule". The reasoning that stood
  behind it — the planner's subject is the arrangement, which a list cannot
  express — was an argument for the pitch, never against a list *beside* it, and
  it quietly conceded its own cost in the next sentence: the one squad you look
  at most was the one you could not read as rows. The desk has the width for
  both (19.jpg), so at `lg` the planner keeps the left and a squad list takes
  the right. The phone still gets the planner alone.

  What does not change with it: the active/reserve rules above are product
  invariants, not properties of the pitch. A list rendered beside a gated view
  inherits nothing by being adjacent — it is gated on its own.
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
