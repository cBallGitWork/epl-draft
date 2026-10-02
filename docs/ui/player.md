# `/players/[fantraxId]` — one player

Championship Manager's player profile (`reference/cm9900/11.jpg`), for a Fantrax
draft league. A plated bar in his club's colour, four tabs, and one cyan line saying
what he actually is.

One profile per tap, never a sweep of the 697 — that is the whole politeness
policy toward Fantrax, and it is why nothing here may loop over `getPlayerProfile`.

## The shell

Every tab wears `PlayerShell`, which is `components/shell/PlateShell` — the third
plated subject, after a fantasy team and a club. It is given the `Subject` whole
rather than a name, a club, a number and a date, because the four views each
derived the same four from the same object.

- **The bar** — `5. Harry Maguire (MUN)`, CM's own construction. The club's
  SHORT name, where CM writes the full one: `5. Harry Maguire (Man Utd)` measures
  306px into the 282 a 390 phone gives the bar, so it shipped truncated.
  Only the pool's longest names (~24 characters) truncate now, and `PageHeader`
  truncating is shared behaviour rather than this screen's decision.
- **The born line** — `Born 21.7.00 (Age 26). Norway.`, from FPL's `birth_date` in CM's own
  unpadded `d.m.yy`, then his country: FPL's `region`, named by `/api/regions/`, never
  Fantrax's birthplace (which put Haaland, born in Leeds, down as England). **On the
  Profile only**, above the portrait (Craig, 1 Oct 2026, on Data: "remove the dob from all
  sections except profile"). It had been in every tab's shell, then on Data alone from 25 Sep.
- **The tabs** — Profile · Data · News · Transfer. **Five until 25 Sep 2026**, CM's own
  count, when History folded into Data. Fitness folded into News on 4 Sep 2026
  (Craig: "Fitness could be doubled in with news") — they were two tabs asking
  one question with half an answer each. Which of them is hollow is decided from
  the SUBJECT, not from the page you are on; each route used to pass its own
  answer, so an unbridged man had the tab he was standing on greyed and the empty
  one left bright.
- **There is no caption box.** `PlateShell` draws CM's yellow one for a club and
  a fantasy team, which have nothing to put in it but the view name — and yellow
  means *active*, which the view you are on is. A player has something better,
  and CM gives that box to the man; but a birth date is not *yours · selected ·
  active · primary*, so it cannot take the accent, and with the tab strip already
  marking the view in accent two rows up a caption reading "Profile" spends the
  slot twice. So the player draws his own box, in ink.

## Profile

1. **The born line**, then **the portrait**, his club's colour behind the cut-out, crest top-left: a banner across a
   phone showing the whole cut-out, and on a desk a 208px column as tall as the grid, filled
   to its foot (Craig, 25 Sep 2026: "cut off mid box").
2. **The attribute grid** — CM 01/02's: alphabetical down three columns on the desk and two
   on a phone, 16–20 in CM's orange and 11–15 in amber, with **Preferred Foot** (off the shot
   map) as its worded row. Every rating is OURS,
   per 90, against **every man of his role** (Craig, 30 Sep 2026: "judge against all
   outfielders who actually play"): keepers against keepers, the rest against all
   outfielders, so a centre-half's Finishing is low as CM's is. The sample is **last
   season's** when he played a third of the most minutes anyone did (1,140 in 25/26), else
   this season's against the same third ("new players get this season"); the heading says
   which, `25/26 · against outfielders`. A keeper gets eight rows, an outfielder twenty-two.
   **Fitness and News** sits under it (Craig, 26 Sep 2026: *"this page should contain the
   latest player news, and their fitness conditions"*), as **plain text** (Craig, 1 Oct 2026:
   *"just remove the chip row and email style preview, just put the text in, with date/time and
   make text bigger"*): for a man who may miss out, FPL's note as one sentence with his chance
   said once (`Muscular injury, 75% chance of playing`); then when Fantrax's newest note was
   filed and the whole of it with its analysis, at `base`/`lg:text-lg`. A fit man gets no
   fitness line. Only the newest: the list is News's. No source caption. With neither, no panel.
   **Rankings** sit under it: his season totals and his place among his position group
   ("rankings for data such as xg").
   **Set pieces** under that: his place in his club's penalty, direct free-kick and corner
   orders (Craig, 30 Sep 2026: "their fk/pk/corner rank for the club"), the same order the
   club's Set Pieces tab draws, counted among the men still there; a dash where he takes none.
3. **The real position**, in cyan — the first thing in the app entitled to that
   slot (see below).
4. **The run to come**, the next eight across the row, in FPL's difficulty, and under each
   gameweek the sister model's projection in our league's points and his place among his group's (Craig,
   30 Sep 2026: "maybe add projections here (and a ranking?)"), lit on the pool board's
   standout rule; a week the model has not read is a dash. No source caption on the panel
   ("FPL's own · Fantrax's own remove"); each figure's title names the model and the group. *Fantrax's projection for the
   round was here and is gone* (25 Sep: "remove row"): it covered one period and only the men
   fielded, so it could not fill a run; the round just gone went on 4 Sep.
5. **Season** — the same Total and Per 90 rows Data opens with. CM puts the
   appearances table on the profile and so does this; a summary belongs on the
   overview as well as above the detail, which is not the duplication that moved
   the match LOG off History — that was twenty rows of detail rendering twice.
6. **Player** — birthplace, height, weight, as Fantrax files them. Birthdate and
   Age are dropped: the box under the tabs already says `Born 5.3.93 (Age 33).`,
   and a screen stating a fact twice invites a reader to check whether the two
   agree.

## Data

His record, one season at a time (Craig, 25 Sep 2026: "maybe we merge data and history
together, shows current season by default with other seasons on a dropdown"). **History
is gone as a tab** and `/history` redirects to `?season=all`; the strip is four plates.

- A **Season** picker: this season (the default), each season
  FPL's history lists, and **All seasons**. It is `?season=`, so a shared link keeps it.
- **This season** — CM's appearances table headed with his club, then **Every match**:
  the house board (Craig: "not like our normal CM standards, use the shared code") —
  bevelled plates over the figures, the round in CM's blue index block and the opponent's
  crest pinned beside it, and each column's best in CM's orange and its top quarter in
  yellow, as the pool board lights them. The score links to `/prem/match/[id]`.
- **A past season** — FPL's line for that season, with the club.
- **All seasons** — every season with the **club he was at** ("mention what clubs he
  played for"), from the sister's identity store (`intel/careers`). A club is printed only
  against a season FPL lists: the store has Haaland at City in 21-22, when he was not in
  the league.

**Two provenances on one row, with a rule between them.** Left of it is FPL's
measurement of the play — minutes, goals, xG, xA, defensive contribution, BPS and
bonus; FPL's own points came off on 30 Sep 2026 so they never sit beside `FPts`, and the
board carries no source caption ("FPL's own · Fantrax's own remove"). Right of it is Fantrax's scoring of the same match,
including **`FPts`, the only per-match source of this league's points anywhere**,
and the five things FPL does not publish at all: shots, shots on target, fouls
committed, fouls suffered, offsides.

**Our mark closes the row, behind a third rule** (Craig, 1 Oct 2026: "put ratings into the player/data section too").
`Rtg` is our rating out of ten for the match, in the derived reading's cyan and never lit as a standout, from
`data/ratings/26-27.json`, which `npm run ratings` files after each settled match day. The season table above carries
his average over the matches rated, on the profile and on Data alike. A match not yet rated, or too brief to rate,
dashes.

**FPL's history is the spine and Fantrax fills in.** They are joined on the
opponent and the venue — safe in a league season, since a man plays each opponent
once at home and once away — and the codes are translated first, because Fantrax
says `NOT` where FPL says `NFO`. Fantrax's table is captioned "Recent Games" and
they do not publish how far back it reaches, so a match beyond it dashes on all
six columns and a line under the table says how many of the matches they covered.

**The rows are 36px, not CM's 18.** A tappable score is a control and takes the
control floor; one cell at 36 makes the row 36. CM's appearances table could be
dense because nothing in it was clickable. That is the price of the link and it
was paid deliberately.

*It was two figure grids for one commit* (Craig, 4 Sep 2026: "Grids is absolutely
terrible"). A grid of season totals cannot show form, which is the question a
manager actually arrives with.

## News

**Mail's own shape** (Craig, 25 Sep 2026: "should match the Email/news section"): the
dated list beside the letter on a desk and above it on a phone, the open row on CM's red
ground, and the story opened in Mail's `Letter`, from "Fantrax's news desk". Since 30 Sep 2026
it is Mail's own code, not a copy: `news/Mailbox` and `news/MailRow`, and Mail's empty panel. **The preview
is the whole first sentence** ("text on preview line cuts off too early"): Fantrax cuts its
headline at about a hundred characters with "...", so where the story begins with the cut
headline its first sentence stands in, over two lines.

**Fantrax's stories and nothing else** (Craig, 4 Sep 2026: "Remove the FPL part").
FPL publishes one availability line, and that is a STATE rather than a story —
whether he can play, which the badge and the pitch already answer. Putting it in a
list of dated reports made the newest item a sentence saying nothing had happened.

**Trimmed to 1 July**, which is where a football year starts and where a summer
signing's news begins to matter. The year is derived from the date rather than
written down: January to June belongs to the July before it, so a constant would
be wrong from New Year's Day and would silently show eighteen months.

The body is dropped when it IS the headline. Fantrax files match reports whose
headline and content are the same sentence — most of them — and printing both put
one line twice under itself. A transfer story has a longer body and gets both.

## Transfer

CM's Transfer tab for our league (Craig, 25 Sep 2026: "improve this page so its more CM
like"), in four blocks:

1. **Transfer status** — CM's label-and-value lines: who holds him (a team, or "Free
   agent" / "Waivers" in Fantrax's words), how and when he joined that team (the latest
   executed move that put him there, or "In the draft"), and his draft pick with what it
   is worth against Fantrax's ranking (`+15 on his pick`).
2. **Business** — every claim, drop and trade with him, newest first, on the house table:
   the date in the index block, then the move, from and to ("The pool" for no team), a step
   above a row's type (Craig, 1 Oct 2026: "make text bigger in business"). Neither panel says
   "This league" any more (Craig: "remove 'This league' twice"); the tab is only ever ours.
3. **The cyan line**, how he arrived: `Taken by 123 with pick 21 of round 3.`
4. **The way out**, worded for what the reader can do: "Claim him on Fantrax" for a man
   nobody holds and "Open on Fantrax" for his own, both to his Fantrax page in the league;
   "Offer a trade on Fantrax" for a rival's, to the owner's roster with Fantrax's trade panel
   up (`team/roster;teamId={owner}?tx=true`, Craig, 1 Oct 2026).

The whole-of-Fantrax block (drafted %, ADP, rostered %) stays gone (4 Sep 2026).

## History

Folded into Data on 25 Sep 2026; see above. **The seasons table shows only the columns
that are real in every season.** FPL writes every key on every row back to 2014/15, so a
statistic it did not collect that year arrives as a nought rather than an absence;
`fpl/raw.ts` carries the count.

## The attributes

Sports Interactive's are licensed and there is no feed for them: the route through
FM26 is a plugin, an in-game keypress and a manual CSV of whatever columns are on
screen. So every rating here is derived from play we already measure, on CM's 1–20
scale, and **what we cannot measure gets no row** — Agility, Balance, Bravery, Flair and
Technique are absent rather than invented.

Each row's source is in its title. The ones Craig called on 30 Sep 2026: **Finishing** is
expected goals on target per 90 ("finishing should be using xgot"; goals less xG put
Haaland at 3 on 25/26, this puts him at 20); **Work Rate** is distance covered per 90 and
**Pace** top speed, both off SofaScore's running, which exists only from 26/27 ("work rate
could use our running data"); **Acceleration** is sprints per 90. **Consistency** is his
mean match rating over his worst quarter of starts, because a spread of ratings put every
striker at the bottom; **Teamwork** is xGBuildup per 90, because touches did the same;
**Handling** is the share of shots on target he saved, because saves per 90 put Raya at 1.
The counts are the sister's `lines/{season}.json` (`docs/providers/intel-export.md` §9).

It is the fraction of the cohort he is strictly better than, not the midpoint of his tie,
so a block of noughts sits at 1.

The ratings are set in CM's orange (`--color-peak`) from 16 and amber (`--color-mid`) from 11,
never CM's yellow: yellow is `--color-accent` and means *yours · selected · active*.

## The cyan line

`Defender (Centre)` — his real position, from the sister repo's role pipeline,
which weighs FotMob, Understat, SofaScore and recent Premier League starts,
written in Championship Manager's own words: the roles joined by a slash, the
sides joined by a slash in brackets, as `cm9900/11.jpg` closes with
`Defender/Defensive Midfielder (Left/Centre)`. `realPositions.ts` holds the
twenty codes.

**`secondaryPositions` only, never `canCover`.** The depth chart is who could fill
in, not where a man plays — Maguire's is `DM/LB/RB`, and it was printed here for
one commit (Craig, 4 Sep 2026: "Maguire not a dm or rb"). 70 of 651 have a real
secondary; the rest print one role.

This is the first thing in the app that *means* what the cyan slot means. DESIGN
§3 retired "cyan means a person" on 3 Sep 2026 and left the slot for *"a derived
reading — ours rather than recorded"*, near-empty until a derived figure claimed
it. A weighted role is exactly that, and §3 names Position among CM's own cyan
columns.

Near-empty rather than empty: the assist chip and the captain's armband already
wear it, and both are recorded facts rather than derived readings — pre-existing
occupants of a slot whose meaning changed under them.

**Never FPL's `element_type`**: 146 of 651 men have null here, and the screen says
which of the two silences it is — no row at all, or a row whose only position came
from FPL's fantasy classification.

## States

- **No profile for that player**, with the tell on screen. A mistyped id and a
  Fantrax outage arrive identically and this does not pretend to tell them apart
  with a 404.
- **A man the bridge has never settled** — 88 of 694. No portrait, no grid, no
  position and no history, each saying why. Fantrax's own blocks still draw, so
  Profile, News and Transfer are not empty; Data and History are.

## Known gaps

- **A rating is a ranking in this season, not a claim about the footballer**, and
  early in one those come apart. Most of the division is on nought for most of
  these measures, so any non-zero figure clears half the league at once: three
  rounds in, Maguire's 0.01 expected assists rated Passing 18 — true as a ranking
  and worthless as a reading. It settles as the season fills, and it is left
  undamped deliberately: damping needs a confidence model nobody asked for, and
  turns a number that is honest-but-thin into one that cannot be explained.
- **The grid is sixteen attributes against CM's thirty-one.** Shots, shots on
  target, fouls committed, fouls suffered and offsides are Fantrax-only and would
  buy five more — Aggression, Dribbling, Technique among them. They are not in
  yet because a percentile needs the whole division and `getPlayerProfile` answers
  one player at a time; the pool-wide table that would carry them
  (`getPlayerStats` with `positionOrGroup`) needs its own probe first. **The Data
  tab shows those five numbers already** — displaying one man's needs only his own
  profile. It is the RANKING that needs a population.
- **Data is this season and only this season.** "As default" is the word Craig
  used, and what it wants next is a season picker and the shot and pass maps.
  Neither is here: FPL publishes no shot LOCATION at all, and the sister repo's
  Understat shot data has not been exported for it. That is a pipeline job
  upstream before it is a screen job here.
- **`getPlayerProfile`'s deeper sections are open, and three are unread.** The
  parameter is **`tab`**, taking the `code` off the payload's own `sections` list —
  found on 4 Sep 2026 after eleven other names were tried and ignored. `NEWS_NOTES`
  is read. **`TEAM_SERVICE_TIME`** (a row per gameweek: team, status, position),
  **`TRANSACTIONS_FANTASY`** (richer than the league-wide feed — it names what was
  dropped in the same move) and **`GAME_LOG_FANTASY`** are not. Service time is
  what CM's Transfer tab would really want.

## Rebuilt against the reference, 4 Sep 2026

Craig read the built screen and sent a list. What changed, and what the change
answers to:

**The bar names the FANTASY side, not the club** — `Bruno Fernandes (123)`,
and no shirt number. CM writes `3. Michael Ball (Everton)` because in that game
the club is the thing you manage; ours is not, the club is already on the
portrait in its own colours and on its crest, and the number was null for 98 of
625 men.

**The caption carries where he is from** — `Born 8.9.94 (Age 31). Portugal.`,
which is `cm9900/11.jpg`'s own line (`Born 2.10.79 (Age 19). English.`). The
country is taken off the end of Fantrax's birthplace and the town dropped; the
adjective is not invented, because a demonym table is not a fact we hold. The
Birthplace/Height/Weight block went with it.

**Keepers get their own grid.** Each row in `football/attributes.ts` says whose it is
(`for: "keeper" | "outfield" | "both"`); the app reads the role off the sister repo's real
position, because the football layer holds no position by rule. No name means one thing for
a keeper and another for an outfielder, so Compare can pair rows by name.

**Good attributes are the loud ones.** A step down in loudness rather than a
second hue: `--color-mid` above 15, `--color-muted` to 8, `--color-faint` below.
Red was the obvious reading of Craig's *"orange/red"* and is refused —
`--color-bad` means *a loss, a doubt, a negative*, and a 19 painted with it
inverts the one slot the rest of the app leans on.

**The position line closes the screen**, in cyan and at `2xl`, which is where
`cm9900/11.jpg` puts `Defender/Defensive Midfielder (Left/Centre)`. It had been
inside the grid column, reading as a caption on the attributes.

**It had also never been cyan.** `.cm-panel` carried `color: inherit` — a
declaration a panel does not need, at the same specificity as Tailwind's
`text-*` and loaded after it, so `class="cm-panel text-info"` resolved to the
inherited ink and the utility was silently dropped. Found by reading the rendered
colour rather than the source. `desk.css` records it.

**The appearances table is CM's**, not FPL's: competition rows down the left
against plated heads, `Apps Min Gls Asts Con CS Sv Yel Red FPL`. One row, because
FPL publishes one competition — five rows of dashes would be five confident
statements that he has played no cup football.

**History is FPL's stack in our formatting** — this season as the first row of
one table, the completed ones under it. Two tables with the same heads, one above
the other, is a reader checking whether they agree.

**Transfer closes with a sentence** — `Taken by 123 with pick 1 of round 1.` in
cyan, under the business, the position line's shape doing the same job. The
whole-of-Fantrax demand block is gone.

**News opens any item.** `?story=` in the URL rather than client state, so a
story can be linked and the tab stays one server read. Rows carry the time as
well as the date, and the headline no longer prints twice.

**No foot buttons on any tab.** CM's foot is Back/Next; ours were named
destinations the rail already reaches at every width.

### What the pass deleted

`Facts.tsx` (both readers removed), `Breakdown.tsx` and `season.ts`'s
`playerSeason` — the Fantrax year-to-date pipeline behind the History block that
went. When a screen goes its reads rarely go with it; these were found by
following each export back to a consumer and finding none.
