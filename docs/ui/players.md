# `/players` — Find

Every player Fantrax knows, what our league has decided about him, and what
Fantrax scores him. **It is its own section as of 6 Sep 2026** (Craig: *"I think
this function will be its own section away from the league etc"*), wearing
`players/Shell` rather than `LeagueShell`.

The URL did not move. A URL is persisted the moment somebody shares it, and the
route is the same route — only its frame and its place in the app changed.

## The section

- **"Find", which is Championship Manager's own word for this slot** (Craig,
  10 Sep 2026: *"replace with something more CM"*). Its rail in `cm9900/12.jpg`,
  `11.jpg` and `25.jpg` reads `Continue Game · <manager> · Competitions ·
  Nations & Clubs · Find · Game Options`, and Find is the entry for looking a
  player up. It read **"Scout"** until then, on the argument below — which had
  cited CM's own `Find` as the reason Scout beat Players, a stand-in for a word
  the reference already had. The URL stays `/players`.
- ~~**"Scout", not "Players"**~~, on the bar and on the nav plate. It is already this
  repo's word for the activity — `players/[fantraxId]/scouting.ts`, DESIGN §9's
  "scouting table", ROADMAP §7's "scouting notes, waiver intel" — and
  Championship Manager's own rail carries `Find` in exactly this slot, a verb for
  the same job rather than a noun for the people it is done to.
- **The royal-blue bar, not the cream competition plate.** `PageHeader` draws two
  and which one a screen gets says what KIND of thing it is about (`cm9900/24.jpg`
  is a competition, `25.jpg` a club or a person). The cream plate is spoken for
  by `/league` and `/prem`; Scout is not a competition, it is the activity, so it
  takes the bar every other subject-without-a-colour takes.
- **It reaches the nav through `More`.** The foot row's ceiling is measured — six
  plates at 320 are 53px each against a widest label of 44 — so the sixth plate
  is a door and everything past the fifth section lives behind it. DESIGN §2
  carries the arithmetic and the rule.
- **Two views**: Overview and Analysis, on `players/PoolNav` — "Board" and "Compare" until 10 Sep 2026. Overview is CM's own first-tab word (`cm9900/12.jpg`, and `16.jpg`'s `Match Overview`), and it is what the view is: the whole pool at a glance, against Analysis, which is one man or two looked at closely. The strip arrived with
  the second; `league/SectionNav` records the ruling that one entry is a stray
  button rather than a bar.

## On the page — the Board

**As many columns as Fantrax shows** (Craig, 6 Sep 2026), and the same shape
Fantasy Football Scout's Stats Centre uses. What stood here until then was a
Championship Manager leaderboard of ONE measure with two rows of blue plates
above it to choose which — goals, then assists, then penalties missed, one at a
time. A sortable table shows all of them at once and answers the same question
with one tap instead of two.

Twenty-three columns in Fantrax's own order: `Player Pos Club Sta Opp FPts FP/G
Ros +/- GP Min G A AF CS GAO GA Sv PKS YC RC PKM OG`. `columns.ts` is the table
and each column names the payload it reads.

*It was twenty-four until 10 Sep 2026, when Craig cut `Rk` — "remove the rank
number column".* It had stood down on a phone since 6 Sep on the same reasoning
carried one step further: the rows are in an order the reader chose, and Fantrax's
absolute ranking is a fact about a different competition. Nothing sorted by it —
`DEFAULT_SORT` has been `fpts` since 6 Sep — so it went without a trace.

- **Two payloads, no new reads.** The seven fantasy columns come off the plain
  `getPlayerStats`; the raw counts off the same endpoint asked by position group,
  which answers 18 columns for the outfield and 20 for keepers. Both halves were
  already being fetched to feed the board this replaced. `mapPlayerStats` drops
  the fantasy seven from its bag, so the two never overlap.
- **A keeper's blanks are absences, not noughts.** An outfielder has no `Sv` and
  a keeper no `GAO` — the key is missing rather than nought and the cell dashes.
  Nought saves for Haaland is a statistic about a thing that cannot happen.
- **Every row leads with a face on his club's colour.** The FPL code comes
  straight off the bridge rather than through a football snapshot: the code is
  all a portrait needs, and joining the whole football layer here would give a
  page that is otherwise entirely Fantrax's a second provider to fail on.
  Fantrax's club code is translated through `toFplClubCode` first — the two
  agree on eighteen clubs of twenty, and the other two would take the fallback
  grey on every row.
- **Sorting is a link, not a click handler.** The server orders, the phone gets
  HTML, and a sort survives being shared. The heads are
  `components/league/TableHeads`' — the shared bevelled plate, drawn PRESSED on
  the column in force (Craig, 6 Sep: *"where are the column headers using a grey
  box that can be selected"*). This screen rolled its own for one day and was the
  only sorting table in the app with no plate on any head.
- **`FPts` descending is the default**, which is Fantrax's own, and it is named
  in `columns.ts` rather than taken as the first entry so reordering the table
  cannot silently change what it sorts by.
- **`Rk` stands down under a thumb** (Craig, 6 Sep: *"for mobile ditch the rank
  column, wasted space"*) — **unless it is the column being sorted by**, because
  DESIGN §2 forbids hiding the sorted column: `display: none` takes the pressed
  plate, the arrow and `aria-sort` with it.
- **The name column is frozen**, DESIGN §9's decision finally built. Capped under
  a thumb and uncapped on the desk: it is legible at any scroll position, and
  uncapped it took two thirds of a 390 screen and left three columns showing.
- **Nothing else is hidden on a phone.** The table scrolls sideways with CM's own
  bevelled bar. DESIGN §2's table-geometry rule is why this stands where the
  standings tables subtract: a directory has no last column that matters more
  than the rest.
- **`Opp` is the fixture and nothing else** — `MCI`, `@CHE`. Fantrax's cell
  carries a kickoff too, and it renders it in the league's own timezone, which is
  US Eastern: "Sun 9:00AM" there is a 14:00 kickoff, where every other clock in
  this app is London. The column therefore had to carry `(ET)` in its own heading
  or lie by twenty-nine hours a week. Craig cut the time on 10 Sep 2026 (*"just
  the fixture please"*) and the whole problem went with it — an opponent has no
  timezone, so the heading is `Opp` and the zone note is retired. `fixtureOnly`
  splits on the first whitespace, which keeps `@`: the away marker belongs to the
  fixture, not to the clock.
- Paged at `PAGE_ROWS` with a "show all" escape.
- **A way out to Fantrax**, because this is where a manager decides who to claim
  and Fantrax is where the claim happens. We read their league and never write
  to it.

## The plates, the rate and the marks (10 Sep 2026)

Craig put **Opta's season-stats grid** beside this board — *"it organises the
data much better than us, but we still keep our standard CM style"* — and four
things came out of it. All of them are URL state, so the board is still a server
component and any view of it is still shareable.

**Stat-group plates.** A blue strip of `All · Scoring · Attacking · Defensive ·
Discipline · Market` under the search box. `All` is first and remains the
default, so nothing Craig asked for on 6 Sep has left the board — the plates are
a way to put twenty-four columns down to eight, not a way to hide them.

- The **spine** — name, position, club — is drawn under every plate. A column set
  that could hide the man's name would be a table you cannot read.
- **So is the column the board is ordered by**, which is `desk.ts`'s `standDown`
  rule in a second place. A hidden column is DELETED, taking the pressed plate,
  the arrow and `aria-sort` with it; sorting by `FPts` and then tapping
  Discipline would leave an order nothing on screen explains.
- The vocabulary is the pool's own and **not core's `GroupKey`** — this board has
  scoring and market columns no other board has, and no use for `appearances`.
  `groups.ts` records why it draws its own strip rather than using `GroupNav`.

**A per-90 toggle.** Every raw COUNT divided by the minutes behind it; a rate, a
rank or a share is left alone, which is what makes the toggle safe to leave on.
Two things it must not do, both of which it did for an hour:

- **It changes what the board SORTS by**, not just what it prints. `figureOf` is
  the single answer to "what does this column show for this man", read by the
  cell, the comparator and the mark arithmetic alike.
- **It refuses a man who has not played a match.** Without that floor the top of
  the board was a wall of men on `90.00` — one minute, one point, rated as if
  they played every week. They dash instead, and absent figures sort last.
- `GP` and `Min` are **never** rated: minutes per ninety minutes is ninety on
  every row.

*A minutes floor shipped alongside it and was deleted the same day* (Craig:
*"per 90 is just a toggle, remove the minutes thing"*). It was two chips, a
derivation, a narrowing and a filter clause to answer "hide men who barely play"
— a question a reader answers by looking at the `Min` column. It also spent an
hour hardcoded as `[0, 90, 450]`, where the `450+` chip emptied the board to
"0 of 672" because this is gameweek 3 and nobody can have more than 270 minutes;
deriving the floors from the largest `Min` in the pool fixed that, and then the
whole control went. `per90`'s own one-match floor is the guard that mattered,
and it is arithmetic rather than a control.

**Standout marks**, which are the part that is ours rather than Opta's. Their
grid shades every numeric cell on a continuous brown-to-purple ramp; DESIGN §3
cannot have one, and Craig's ruling was to keep the idea and drop the ramp —
*"magnitude ramp, but maybe just highlight the really good values? we also can
use better colours for us too"*. So a cell is lit or it is not.

- `--color-hot` is a figure at the top of its column, `--color-cold` the same at
  the wrong end of one. Both are grounds, and both are the DIRECTION PAIR filled
  — `--up` and `--bad` at a ground lightness — so the mark costs no new hue and
  needs no learning. They were brown for an hour, taken from the reference; Craig
  threw it out (*"can we use more fun CM colours than brown though?"*).
- **The rule**: the highest figures, taken whole values at a time, for as long as
  that stays inside a sixth of the men who have a figure at all. A column whose
  top value is common lights nothing — `GP`, `Min` in August, `YC`.
- **The population is the rows drawn**, so a mark means "the top of this column,
  among what is in front of you" and re-reads on every filter.
- A lit cell takes the loud ink. `--color-faint` is 3.42:1 on the hot ground.

**The board is opaque**, and it is the only table in the app that is (Craig:
*"also it needs to be opaque too"*). `.cm-panel` is deliberately 88%, which is
right for a ten-row table in `text-base` and wrong for twenty-four columns of
`text-2xs` over a photograph with a white crowd in it. The frozen name column had
been opaque since it was frozen, so the board was rendering one solid column and
twenty-three translucent ones.

**The controls are one row at every width.** Craig: *"when i said messy, i meant
essentially three rows of column headers"* — the blue group strip, the grey chip
field and the table's own grey head strip, the middle two wearing the same
`cm-bevel`. A chip and a column head are the same object in this vocabulary, so
three full-width rows of small bold capitals read as three header rows and a
reader cannot tell which belongs to the table. It was never the number of
controls.

**What sits on the row grows with the width, in two measured steps** (*"i think
we can get most things onto one row though"*, against Opta's desktop shot, which
runs search, stat tabs and its two figure controls across a single line):

- **below `lg`** — search, `Find`, `Filter`. Everything else in the drawer.
- **`lg`** — the stat-group strip joins them. It is the most frequent tap, and it
  is the one that most deserves to be one.
- **`xl`** — the `Per 90` toggle joins them. It was `2xl` while the minutes
  chips existed, measured: the frame is max-width capped, so 1440 has only 36px
  more than 1280 and the full set wanted 1136 of 1100. One chip fits at 1280.
  PLATFORM_NOTES carries the measured widths and the way the first guess failed —
  silently, by letting the `flex-1` plate strip fold `Market` onto its own line
  rather than overflowing.

Whatever is not on the row is in the drawer at that width, so nothing is ever
unreachable and nothing is ever in two visible places at once.

- The plate carries **a count of what is on**, so a shut drawer cannot hide a
  filtered board — and it counts **only what the drawer still holds at that
  width**, because totalling controls the reader can already see wearing their
  own pressed bevels is the screen saying it twice. The **caption names the stat
  group**, so a closed drawer cannot hide which columns are on either. `All`
  falls through to Scout's own caption rather than printing "All", which is a
  word about a control and not a name for a board.
- Inside, **one row and no headings** (*"get this onto one row… remove
  figures/who"*). It was three labelled bands for an hour, which was the right
  cure for eleven chips doing three unrelated jobs — and then two of the jobs
  left: the stat groups went up to the row above at `lg`, and the minutes floors
  were deleted. What remains names itself — `Per 90`, `Free agent`, `GK` — and a
  heading over a chip that already says what it is is furniture.
- **`All` leads the row and is pressed by default.** It is the only chip that is
  not a toggle: it drops both filter lists at once and cannot be turned off,
  because turning "all of them" off is not a state. Without it the row had no lit
  plate in its resting state and looked unset rather than deliberate.
- **It opens through the URL (`?panel=1`), not React state.** Every other control
  here is a link; a `useState` drawer would make the one control that reveals all
  the others the only one that needs a script. A link to "the board with the
  filters open on Defensive" is a thing you can send somebody.

**Two columns Craig cut on 10 Sep**: `Rk` is gone outright, not merely stood down
on a phone; and `Opp` is trimmed to the fixture — `MCI`, `@CHE` — by
`fixtureOnly`. That retires `(ET)` from its heading too: the zone note existed
only because Fantrax's kickoff times are US Eastern where every other clock in the
app is London, and a column with no clock in it has no timezone to name. With the
time gone the column is narrow enough to keep on the phone.

## The filters — several at once

Craig, 6 Sep 2026: *"think we need the ability to select multiple filters as
well"*. `?pos=D,M` — a comma list in one parameter, readable in the address bar
and shareable. Union within a filter, intersection between them: a defender OR a
midfielder, who is ALSO a free agent. Requiring every chosen position at once
would be a filter that empties itself on the second tap.

**They stopped being `cm-tab` when they became multi-select** (Craig: *"those
blue buttons for search are terrible here"*). A Championship Manager tab strip
picks ONE of a set and marks exactly one plate current — that is what the object
means — so six blue plates with any number lit is a tab strip making a claim it
cannot keep. They wear the raised/pressed grammar instead, which fits exactly,
and are the same grey plate as the column heads above them.

**The mark is a tick, not the accent.** `desk.css` says a plate owns its ink and
no call site sets `text-*` on one, because `--color-accent` on the grey plate
would be illegible. It was set anyway for one build and `probe.mjs` read the same
dark ink off a pressed chip and an unpressed one — dropped exactly as that
paragraph says it would be. The pressed bevel carries the state and the tick
carries it again as a SHAPE, which is PRODUCT.md's accessibility rule.

The status codes are Fantrax's (`FA`, `WW`, `T`); anything we have not seen
renders as the raw code rather than as a guess.

## Provenance, which is load-bearing here

The heading says which season the numbers are **and whether they were played or
predicted**, and a column headed FPts that silently switched between the two
would be the confident wrong answer.

*Fantrax used to default this read to a projection and now defaults it to
`SEASON_926_YEAR_TO_DATE` — re-probed 5 Sep 2026, PLATFORM_NOTES carries it. The
heading changed by itself, which is the whole reason it is read off the payload
rather than written here.*

## States

Unavailable — ownership is the part that would go stale first, so the page shows
nothing rather than yesterday's.

**A picker.** With `?compare=` naming a first man the board's rows lead to the
comparison instead of to a player, and a banner says so: a table whose rows have
quietly changed destination is a screen that lies about what a tap does.

## Known gaps

Still no sense of **who is worth looking at** beyond what Fantrax counts. The
football-layer signals the pool has always wanted — form, fitness, the fixture
run, and the positions your own roster is short of — are specified in
`~/.claude/plans/the-player-search-when-fuzzy-cupcake.md` and their core half is
built (`football/form.ts`, `playedRounds`, `formByPlayer`, `availabilityOf`).
They are not on the board yet.

## What came off on 10 Sep 2026, and what replaced it

**The count-and-season line under the title bar** (`672 of 672 · 2026-27 - YTD`)
— Craig: *"remove that row"*. It was doing one job worth keeping: saying whether
`FPts` holds what a man SCORED or what Fantrax PREDICTS. That read defaulted to a
projection until 5 Sep and can change again without anybody touching this app, and
a column headed `FPts` that silently switches between the two is the confident
wrong answer DESIGN §7 exists to prevent. So the provenance moved into the
**caption, and only when it bites**: year-to-date actuals are what a reader
assumes and get no words; a projection says so every time. A permanent bar
reading "YTD" is furniture, and furniture stops being read.

**`Pos`, `Club` and `Sta` stopped being columns** — *"position and club are
constants, they should be next to the player in the same column… probably status
too"*. They are identity rather than measures: nobody ranks six hundred men by
club, and three text columns between the name and the first figure meant a phone
opened on `M · MUN · 123` and no number. They now sit under the name inside the
same link, which is where every other table in the app puts a club. The owner
reads loud and a bare status reads quiet, which was the `Sta` column's whole
design and comes across with it.

*Three sorts went with them, and none of the three is a loss.* Position and
status have had filters in the drawer since **6 Sep** — they predate this work,
so removing those two columns was not a trade for anything, it simply took away a
sort nobody used in favour of a filter that was already better (you want
defenders, not a table beginning at D). Club was the one real gap, and Craig
closed it the same day: *"put club in the filters section though!"*.

**The club filter is a `<select>` and the other filters are chips**, which is the
only place this board mixes control shapes. Status has three values and position
four; club has twenty, and twenty plates is a wall that would take the drawer
straight back to the wrapped rows it was collapsed out of — while giving the
least-used filter the most space on the board. It is also single-value where the
others are unions: a reader wants defenders OR midfielders, and nobody asks for
"Arsenal or Chelsea". The clubs offered are read off the POOL rather than from
the football layer's twenty, so the list can never contain a club whose selection
empties the board.

**Every control on the row is one object at one size** — *"clean up this ui, all
buttons different sizes, we can CM this now"*. Five kinds of control sat on that
row at four heights and three type sizes: the search field at 44px and
`text-base` with no desk step at all, `SUBMIT` and `BUTTON` at `text-sm
font-medium` in sentence case, the chips at `text-2xs font-bold uppercase`, and
the blue plates at a third height. Championship Manager's chrome is uniform, and
`desk.css` already put the chrome FACE on all four plate classes — what it could
not do is the geometry, which is layout and belongs to the caller. `PLATE` in
`BoardControls` is that geometry, and the plates now differ only in colour: grey
for a thing you press, blue for a view you are on.

Two exceptions, both stated rather than drifted: the search **field** keeps
`text-base`, because below 16px an iPhone zooms the page on focus and a field is
read and typed into rather than pressed; and the club `<select>` takes
`PLATE_TYPE` — the same recipe without the flex — because `display: flex` on a
replaced element is not a thing browsers agree about.

**The stat plates are `cm-tab-quiet`**, a new modifier — *"we already have blue
bars on this page, do we need them this big?"*. `.cm-tab` is 56px above `lg`
because CM's tab strip is chunky, and that reasoning is about the strip a screen
is navigated by; a second strip choosing a view of the same board is not that
object and competes with it at the same height. The modifier drops it to the 36px
control floor. It has to be a CLASS: `league/GroupNav` has carried a `lg:min-h-9`
since it was written and it has **never taken effect** — measured on the shipped
Team Stats board, where the plate computes `min-height: 56px`, because a Tailwind
utility and `desk.css`'s media rule are both one class of specificity and
`desk.css` comes last.

## The refactor pass (10 Sep 2026)

Run over everything above, twice, on CODE_RULES §1's arithmetic rather than
judgement.

**Extracted, with the count that justified it.** `PRESSABLE` — the grey bevel
plus the row's geometry — at **three** sites: the `Find` button, the `Filter`
link and an unpressed `Chip`. `ClubPicker`'s `<noscript>` button was a fourth
that differed only in having no hover, which was an oversight rather than a
decision; folded in.

**Declined at two, and the count is the point.** `const DASH = "—"` appears twice
in this module (`Cell`, `compare/Measures`) against `desk.ts`'s recorded app-wide
tally of 11 named against 55 unnamed literals. Naming it a twelfth time makes the
codebase look centralised where it is not. Left, as that file's "Declined"
section asks.

**A bug the extraction found.** The search form and the club picker each rendered
the rest of the query as hidden inputs by hand, and **both omitted `compare`**.
Every LINK on this board goes through `href()`, which spreads the whole query, so
tapping a filter chip while picking the second man of a comparison keeps the
first — exactly as `query.ts` promises. Typing in the search box did not: it
dropped him, and the board silently stopped being a picker. One `Carried`
component now renders the fields for both, from one list.

**Dead pipeline removed.** No column had set `deskOnly` since `rank` was deleted
that morning, so the whole stand-down apparatus in this module was inert: the
field on `PoolColumn`, `PlayerTable`'s `phone()`, the `hide` prop threaded into
five of `Cell`'s cells, and the skeleton's two copies. A field nothing sets,
plumbed through three files, reads as a capability the board has and does not.
`desk.ts`'s `standDown` keeps its other two callers. A test asserts no column
carries the flag, so restoring it means restoring the plumbing too.

**`ScoutShell.sub` removed** — no caller left once the count line came off; the
comparison screen never passed one.

**`MINUTES_KEY` made private** — the minutes filter was its second reader.

**Eleven stale counts corrected.** Six files said the board has "twenty-four
columns". It has **twenty**, and has since the four identity columns moved in
beside the player's name.

**The loading skeleton was describing a different screen** — its own docblock
says a skeleton must not, and it was: a header line that no longer exists, a
taller `Find` button on the old `BUTTON` recipe, three arbitrary-width bevels
where six named plates go, no `Filter` at all, and a round portrait where the
crest now sits. It reads off `POOL_GROUPS` and the shared recipes now, so it
cannot drift again. Its plates are deliberately inert: `loading.tsx` is given no
search params, and a link built from an empty query would drop a reader's filters
if he tapped one while waiting.
