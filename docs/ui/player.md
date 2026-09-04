# `/players/[fantraxId]` — one player

Championship Manager's player profile (`reference/cm9900/11.jpg`), for a Fantrax
draft league. A plated bar in his club's colour, five tabs, his birth date in a
box under them, and one cyan line saying what he actually is.

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
- **The caption** — `Born 5.3.93 (Age 33).`, from FPL's `birth_date`, in CM's own
  unpadded `d.m.yy`. Null for 19 of 652, and then the box carries the view's name
  instead. It stops after the age: CM's nationality has no source we hold — FPL's
  `region` is an opaque integer over 67 values with no lookup published, and
  Fantrax's birthplace is a label inside a list of English strings.
- **The tabs** — Profile · Data · News · Transfer · History. **Five, which is
  Championship Manager's own count.** Fitness folded into News on 4 Sep 2026
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

1. **The portrait**, 176px on his club's colour, crest top-left. Beside the grid
   on the desk and above it on a phone — a single column at 1440 left 900px of
   nothing between every label and its value, which is a phone layout stretched.
2. **The attribute grid** — three columns of `label · 1–20` on the desk, two on a
   phone. Every rating is OURS, derived, and says what from on hover.
3. **The real position**, in cyan — the first thing in the app entitled to that
   slot (see below).
4. **The run to come**, FPL's, then **Fantrax's projection**, theirs and gated on
   the lineup. Together these answer PRODUCT.md's third-most-frequent job,
   "should I start this player". *The round just gone was here and is gone*
   (Craig, 4 Sep 2026: "Remove gameweek so far") — one round of one man's figures
   is a Data question. The card that drew it was deleted rather than moved.
5. **Season** — the same Total and Per 90 rows Data opens with. CM puts the
   appearances table on the profile and so does this; a summary belongs on the
   overview as well as above the detail, which is not the duplication that moved
   the match LOG off History — that was twenty rows of detail rendering twice.
6. **Player** — birthplace, height, weight, as Fantrax files them. Birthdate and
   Age are dropped: the box under the tabs already says `Born 5.3.93 (Age 33).`,
   and a screen stating a fact twice invites a reader to check whether the two
   agree.

## Data

This season, in Championship Manager's own shape: rows of matches against columns
of statistics, in two sections.

- **Season** — `Total` and `Per 90`, the row labels in CM's index block. Both
  references agree on this: `cm9900/11.jpg` closes a profile with an appearances
  table, and FPL's own player page closes the same table with Totals and Per 90.
- **Every match** — one row per match, most recent first. The score links to
  `/prem/match/[id]`.

**Two provenances on one row, with a rule between them.** Left of it is FPL's
measurement of the play — minutes, goals, xG, xA, defensive contribution, BPS,
and FPL's own points. Right of it is Fantrax's scoring of the same match,
including **`FPts`, the only per-match source of this league's points anywhere**,
and the five things FPL does not publish at all: shots, shots on target, fouls
committed, fouls suffered, offsides.

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

Championship Manager's news screen, which is an email client: a list of dated rows
at the top, newest first, and the newest opened underneath with its headline
centred in yellow over its body.

The accent is right here by our own rules and not only by CM's: DESIGN §3 gives it
to *yours · selected · active*, and the opened item is the selected one — the
single place on this screen where anything is.

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

**Business** — every claim, drop and trade this league has made with him, newest
first, with both sides named. This is what CM's Transfer tab is for: the game
lists a player's moves between clubs and ours lists his between managers. A
pending move is drawn quiet and labelled, because Fantrax distinguishes proposed
from executed and the default filter hides the proposals.

Then the draft pick, our league's row — whose he is and what the commissioner
deems him eligible for — and the whole-of-Fantrax market: ADP, percent drafted,
and the two ownership percentages, which are every league on the site and not
ours.

It carries **no fantasy-points figure, no season row, no prose and no note**
(Craig, 4 Sep 2026: "Remove at this club and In this league sections too. Keep it
clean", then "strip out all the unneeded Info"). What is left is how he arrived,
what has happened since, and what the rest of Fantrax will pay.

**Draft is one row and disappears for a man the draft did not take.** It used to
draw a sentence — "Undrafted. He came off the waiver wire, which cost a claim
rather than a pick." — which is a paragraph in a panel restating what the Business
list below already shows as a dated claim. The market block lost its note for the
same reason: it explained a heading that already said it.

**No fantasy-points figure appears on this tab** (Craig, 4 Sep 2026: "Remove all
unneeded info from transfer tab like stats"). Fantrax mixes his scoring into two
of the blocks it hands over — `FPts` and `FP/G` in the league row, and those plus
his positional rank among the whole-of-Fantrax numbers — and all of it is Data's
job now, in Data's shape. A points total in two places on one screen is a reader
checking whether they agree.

The scoring rows are dropped by name; the two ownership rows are KEPT by name. The
asymmetry is deliberate: `FPts` and `FP/G` are stable labels, and the rank's is not
— it carries the position (`Rank G/Ov`, `Rank D/Ov`) and cannot be matched by a
fixed string.
CM's `Contract` is folded in here as one row — **At this club · Joined**, from
FPL's `team_join_date` (633/652). It is a stand-in: what this tab wants is
Fantrax's own `TEAM_SERVICE_TIME`, which their payload names and will not serve.

## History

His match log and his previous seasons, both FPL's, then what he has been worth
in this league by the categories that pay, which is Fantrax's. The third block
names the league in its heading because it sits under two headed "FPL's own".

**Previous seasons shows only the columns that are real in every season.** FPL
writes every key on every row back to 2014/15, so a statistic it did not collect
that year arrives as a nought rather than as an absence — `starts`, the expected
family, tackles and defensive contribution all read zero for Maguire's 2021/22,
a season in which he played 2,513 minutes. Minutes stands in for appearances, which FPL has never
published here at all. `fpl/raw.ts` carries the count.

## The attributes

Sports Interactive's are licensed and there is no feed for them: the route through
FM26 is a plugin, an in-game keypress and a manual CSV of whatever columns are on
screen. So every rating here is derived from play we already measure, on CM's 1–20
scale, and **what we cannot measure gets no row** — Pace, Acceleration, Agility,
Balance, Bravery and Flair are absent rather than invented.

Ratings are a **percentile within the division, against everyone who has played**,
never within a position: a defender's Finishing comes out low and a striker's
Marking comes out low, which is what CM shows. It is the fraction he is strictly
better than, not the midpoint of his tie — 203 of the 225 men past the minutes
floor have made no saves, so a midrank put every outfielder at Handling 10.

The ratings are set in `--color-mid` (amber, "a figure"), not CM's yellow: yellow
is `--color-accent` and means *yours · selected · active*.

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
- **The grid is fifteen attributes against CM's thirty-one.** Shots, shots on
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
