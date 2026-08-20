# `/gw/[gameweek]` — one round of football

Any round of the season, addressable. Last week's results on Monday morning is
the second thing anyone wants after this week's score.

Shares `GameweekView` with `/matchday`, so the two never drift.

## On the page

- Header: league crest, name, gameweek, and either a **LIVE** badge with the
  pulsing dot or FPL's deadline.
- **`MatchList`** — every fixture in kickoff order, undated TV picks last. Each
  fixture is a native `<details>`, so the drop-down works with no JavaScript, is
  keyboard operable and screen-reader announced for free. Open one and you get
  who did what: goals, assists, cards, notable saves, bonus, ordered by impact.
  Merely turning out does not qualify — the drop-down answers "what happened",
  not "who played".
- **Your players marked.** A fixture with one of the reader's men in it carries
  the standard accent border (`yoursBorder`, the same mark as every other "this
  is yours" row) and a counted `2 yours` in the summary. Open it and a **Yours ·
  Saka · Gabriel** line sits above the contributions — a different question from
  the one below it, because "which of mine is in this match" has to include the
  man who has done nothing, which on a Saturday is most of them.

  Counted rather than tinted: fifteen players across ten fixtures marks most of
  the list, and every row marked is no row marked. The number is what ranks one
  match above another at a glance.
- Previous / Next round links, bounded by the season FPL actually published, not
  a hardcoded 38. Each end renders an inert placeholder so the other link does
  not slide across the screen.
- A provenance line at the foot: when the data was updated, or — importantly —
  that the Premier League is not serving player stats right now, **so the goals
  below are missing rather than nil**.

## Data

FPL's public API for all of the football. The page **degrades to exactly that**:
signed out, undrafted, or Fantrax silent, the `mine` prop is simply absent and
the round renders byte-identical to the version that had never heard of a
fantasy league. It has no Fantrax-shaped empty state because it has no Fantrax-
shaped claim to make.

`fixtureInvolvement` is a pure join in core, keyed off **squad membership** —
which is public all week. Nothing here reads a lineup, in either direction.

**Historical rounds are marked from today's squad**, deliberately. "Which of
these results matter to me" is asked on Monday by the man who owns those players
*now*; a squad as it stood in week six would need `getTeamRosters?period=`, which
has never been proven to serve history.

## Known gaps

- Nothing marks the *opponent's* players. Whether a manager misses it is a
  question for a real Saturday — recorded as open rather than built, because the
  second mark competes with the first for the same row.
- The drop-down is still plain.
