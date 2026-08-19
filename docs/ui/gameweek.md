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
- Previous / Next round links, bounded by the season FPL actually published, not
  a hardcoded 38. Each end renders an inert placeholder so the other link does
  not slide across the screen.
- A provenance line at the foot: when the data was updated, or — importantly —
  that the Premier League is not serving player stats right now, **so the goals
  below are missing rather than nil**.

## Data

FPL's public API only. This whole page works from the first match of the season
with no Fantrax, no draft and no credentials.

## Known gaps

The fixture row is dense and the drop-down is plain. Nothing marks a match
involving one of *your* players, which is the thing a manager is actually
scanning for.
