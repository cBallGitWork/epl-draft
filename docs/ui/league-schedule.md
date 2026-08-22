# `/league/schedule` — one gameweek, every competition on it

The season, a gameweek at a time. **We never generate a fixture list** — who
plays whom in the league is a commissioner setting like everything else in the
league layer, and comes from Fantrax's own description of the competition.

Same `LeagueShell` frame as the table.

## On the page

Three dropdowns — the round, the competition, and a **fixture list** — then the
ties, boxed by competition. `Controls` builds its own labels from the league's
own data; the page hands over rounds, teams and who is reading. Each tie is **one row**: both sides with their
badges and the score between them, the way a results page prints a football
match.

A round still to come shows **`test4 v test2`, never `0 – 0`**. Fantrax answers 0
for every unplayed period, and printing it against a date in March states a
result for a match nobody has played.

The fixture list dropdown swaps the page for one team's whole season — every
round it is in, the league's and any knockout it has been drawn into, that
team's total first, with results where there are any and "To play" where there
are not. The reader's own team sorts first and is named `(you)`. It costs one
request: `getStandings?view=SCHEDULE` answers the whole season's results at
once, and is read only on that branch.

Picking a gameweek is the way back out of a fixture list — the two are views of
the same season and only one can be on screen, so the control you just used
decides which.

It **opens on the round the reader came for**: FPL's current-or-next gameweek,
narrowed to one the league actually covers. That round's scores come with it, so
a gameweek in the past shows the totals it finished on and the winner marked —
`getLiveScoringStats` honours `period`, so the archive costs no extra read.

State lives in the address bar (`?gw=6&comp=cup`, or `?team=<teamId>`), like
`/players`. The selects sit in a GET form and submit without JavaScript; with it,
changing either one navigates on the spot.

### The date is the deadline

Not the first kickoff. It comes from `locksAt` — **fifteen minutes before the
round's first kickoff**, which is the league's own setting, read off the
commissioner's settings page: `lineupLockType` is "Set amount of time before 1st
game of period" and `lineupLockTimeBeforeGame` is 0:15. Shared with the paper's
masthead so the two cannot print different times.

Measured back from the **kickoff**, never from the period boundary — those are a
day apart whenever the gameweek has no Friday night match. Gameweek 6, the real
league's first, locks **Sat 10 Oct 12:15**.

### Where a tap goes

Depends on whether the football has happened:

| Round | Tap |
|---|---|
| Any football played | the whole row → `/league/matchups/[teamId]?gw=N` |
| To come | each side → `/squad/[teamId]` |

**League ties only.** The head-to-head route resolves its pairing from Fantrax's
league schedule and knows nothing about competitions, so a cup tie would land on
the league fixture those two happened to have that week.

A round still to come has no score and no eleven anyone may see, so the squad is
the only useful destination. The board opens on the reader's own side when he is
in the tie, else on the home side.

"Any football played" is `ScheduleRound.started`, and it is deliberately **not**
derived from the round's status: a Saturday evening with nine results and a
Monday match left is `status: "upcoming"` — right for a caption, and fatal if
read as "no ball has been kicked". See `gameweekStarted`.

### The vocabulary is gameweeks, never periods

Fantrax scores in periods and is queried in them. The translation happens once,
in `schedule.ts`, through `periodGameweeks()` — the seam between the football and
league layers, and it still runs one way only. Both numbers used to be on screen
and they are the same number all season.

### Competitions

`league/competitions.ts` declares them. The league's own ties are Fantrax's
pairings. The cup (semi-finals in gameweek 4, final in 5) and the playoff (final
in 38, top two) are **a placeholder**, say so on screen, and exist to prove one
gameweek can carry more than one competition.

A knockout side is a place in the table or a phrase, never an invented team:
seeded sides resolve against the standings as they stand, and a side that is won
rather than seeded prints "Winner, semi-final 1". An undrafted league draws its
playoff final between "1st" and "2nd".

The number beside a cup tie is that gameweek's Fantrax total — a cup over fantasy
points is scored by the week's points.

## States

- Fantrax silent — `getLeagueInfo` refused, and only that read is fatal here. A
  table we cannot read costs the placeholder brackets their seeding and they
  print places; a badge we cannot read costs a picture.
- A calendar whose periods hold no gameweek at all.
- A gameweek with nothing on: no league pairings (every day until 10 Oct) and no
  knockout round — or a competition filter that this gameweek does not play.
- A team with no badge: its initial on a disc, never a stand-in picture.
- A tie side nobody holds yet: a dashed disc and the place or the phrase, in
  italic.
- A fixture list with no fixtures: that team is paired with nobody, or is not in
  the competition on screen.

## The files

| File | What it is |
|---|---|
| `page.tsx` | The route: which view, and the empty states. |
| `schedule.ts` | The four provider reads, and the season's results on their own. |
| `Controls.tsx` | The three dropdowns. The only client component here. |
| `RoundHeader.tsx` | Deadline, and whether the round is live or done. |
| `Tie.tsx` | One scoreline. |
| `Season.tsx` / `teamSeason.ts` | One team's whole season — the view, and the rows. |

## Known gaps

~~The full-time treatment is written and unwitnessed.~~ Witnessed 22 Aug: six of
GW1's ten fixtures finished with the schedule on screen, the winner marked and
the scoreline printed from `getStandings`. What is still unwitnessed is a
*completed period* — every dated fixture finished — which arrives Mon 24 Aug.

**A played head-to-head shows rosters we cannot prove were the ones fielded.**
`getTeamRosters?period=N` is honoured and echoed for every period, but no period
has completed in either league, so a historic read cannot yet be told apart from
today's roster relabelled. The board says so on screen. Re-ask after 28 Aug and
delete the line if the answer is history.

**No provenance line.** Craig removed it on 20 Aug. The points on this page are
Fantrax's under Fantrax's scoring and the page no longer says so — the only page
that does not. `docs/ui/README.md` principle 2 says every number names its owner;
this is a deliberate exception, not an oversight.
