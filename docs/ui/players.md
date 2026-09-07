# `/players` — Scout

Every player Fantrax knows, what our league has decided about him, and what
Fantrax scores him. **It is its own section as of 6 Sep 2026** (Craig: *"I think
this function will be its own section away from the league etc"*), wearing
`players/Shell` rather than `LeagueShell`.

The URL did not move. A URL is persisted the moment somebody shares it, and the
route is the same route — only its frame and its place in the app changed.

## The section

- **"Scout", not "Players"**, on the bar and on the nav plate. It is already this
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
- **Two views**: Board and Compare, on `players/PoolNav`. The strip arrived with
  the second; `league/SectionNav` records the ruling that one entry is a stray
  button rather than a bar.

## On the page — the Board

**As many columns as Fantrax shows** (Craig, 6 Sep 2026), and the same shape
Fantasy Football Scout's Stats Centre uses. What stood here until then was a
Championship Manager leaderboard of ONE measure with two rows of blue plates
above it to choose which — goals, then assists, then penalties missed, one at a
time. A sortable table shows all of them at once and answers the same question
with one tap instead of two.

Twenty-four columns in Fantrax's own order: `Rk Player Pos Club Sta Opp FPts FP/G
Ros +/- GP Min G A AF CS GAO GA Sv PKS YC RC PKM OG`. `columns.ts` is the table
and each column names the payload it reads.

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
- **`Opp (ET)` names its clock in the heading.** Fantrax renders that cell in the
  league's own timezone, which is US Eastern — "Sun 9:00AM" is a 14:00 kickoff —
  and every other time in this app is London. Their words, their clock, named.
- Paged at `PAGE_ROWS` with a "show all" escape.
- **A way out to Fantrax**, because this is where a manager decides who to claim
  and Fantrax is where the claim happens. We read their league and never write
  to it.

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
