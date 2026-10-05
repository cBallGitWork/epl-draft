# `/league/schedule` — one gameweek, every competition on it

The season, a gameweek at a time. **We never generate a fixture list** — who
plays whom in the league is a commissioner setting like everything else in the
league layer, and comes from Fantrax's own description of the competition.

Same `LeagueShell` frame as the table.

## On the page

**No controls at all**, since 5 Sep 2026 (Craig: *"Dont show all the grey arrows
here, just show all fixtures for the league itself. CM rows etc."*). Every round
the league still has to play, in gameweek order, in one scrolling box with CM's
own bar down the side. A schedule is a thing you scroll, not a thing you
navigate: `cm9900/24.jpg`'s own Schedule tab is one list with a scrollbar and no
filter control anywhere on it. `page.tsx`'s docblock carries what each removed
dropdown cost — the round picker and the competition filter cost nothing, and the
team picker's one view moved to `/squad/[teamId]/fixtures`, which draws it with
the same `Season` component off the same `seasonRows`.

Under each round's head, the ties, boxed by competition. Each tie is **one row**:
both sides by name and the score between them, the way a results page
prints a football match.

A round still to come shows **`test4 v test2`, never `0 – 0`**. Fantrax answers 0
for every unplayed period, and printing it against a date in March states a
result for a match nobody has played.

**Current and future, and nothing finished** (Craig, 31 Aug). Results is the
archive; a fixture list that also holds last month is a fixture list you have to
navigate rather than read. The round in play stays, because it is not finished
and because its scores are the reason anyone opens this on a Saturday — and it
is the only round that costs a scores request, since Fantrax would answer any
period asked and thirty-odd of them are all nought.

### The head names the ROUND, and then the deadline

`shell/RoundHead` — the same strip Results and the Prem's fixture lists head
their blocks with, so the three cannot disagree about what a round is called.
It said DEADLINE and a date and nothing else until 7 Sep 2026, which names the
moment and not the round: a reader scrolling a season had to count Saturdays to
work out where he was, while Results, one tab away, headed every block
`Gameweek 4`. Craig: *"this doesnt actually show what gameweek it is"*.

The date came down to `londonDayAndDate` in the same change — "Saturday 12
September" spelled out took 60% of a 390px plate on its own, and the round's
name now shares it.

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

`league/competitions.ts` gathers them. The league's own ties are Fantrax's
pairings. The two cups are ours, declared in `league/cups/declared.ts`: the
Timbeibs Cup (GW10 to GW17) and the Davy Propper Cup (GW22 to GW30). The playoff
is Fantrax's, so it arrives in Fantrax's own pairings.

Nobody is drawn into a cup yet, so every cup side is a placeholder and the block
says so: "Seed 7", a group slot "A1", a group place "2nd B", or "Winner M5". This
is the cups' only fixture list (Craig, 1 Oct 2026: *"just put fixtures in fixtures
section"*); `/league/cups` keeps the brackets, where M5 is numbered. A cup seeded
on a gameweek's points says so under that gameweek's ties (GW9, Timbeibs Cup).

The number beside a cup tie is that gameweek's Fantrax total — a cup over fantasy
points is scored by the week's points.

## States

- Fantrax silent — `getLeagueInfo` refused, and only that read is fatal here. A
  table we cannot read costs the blue place blocks.
- A calendar whose periods hold no gameweek at all.
- A gameweek with nothing on: no league pairings (every day until 10 Oct) and no
  knockout round — or a competition filter that this gameweek does not play.
- A tie side nobody holds yet: the place or the phrase, in italic.
- A fixture list with no fixtures: that team is paired with nobody, or is not in
  the competition on screen.

## The files

| File | What it is |
|---|---|
| `page.tsx` | The route: which view, and the empty states. |
| `schedule.ts` | The four provider reads, and the season's results on their own. |
| `RoundHeader.tsx` | What this screen adds to `shell/RoundHead`: the deadline, and whether the round is live or done. |
| `Tie.tsx` | One scoreline. |
| `Season.tsx` / `teamSeason.ts` | One team's whole season — the view, and the rows. |

## Known gaps

~~The full-time treatment is written and unwitnessed.~~ Witnessed 22 Aug: six of
GW1's ten fixtures finished with the schedule on screen, the winner marked and
the scoreline printed from `getStandings`. What is still unwitnessed is a
*completed period* — every dated fixture finished — which arrives Mon 24 Aug.

**A played head-to-head shows the rosters that were fielded.** Settled 28 Aug in
two halves: a claim proved Fantrax versions squad MEMBERSHIP per period, and a
lineup move later the same day proved it versions `status` — the only field the
lineup gate withholds. `squads.ts` now asks for a past period through
`frozenPeriod`, which requires both that Fantrax's own label has moved past it
and that our calendar says its lineups locked. The board says which of the two it
is holding.

**No provenance line.** Craig removed it on 20 Aug. The points on this page are
Fantrax's under Fantrax's scoring and the page no longer says so — the only page
that does not. `docs/ui/README.md` principle 2 says every number names its owner;
this is a deliberate exception, not an oversight.
