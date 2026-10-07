# `/league/scoring` — what the league pays for what

The league's scoring rules as a card a manager reads: one line per category, priced for each roster slot.
**Every figure is read from `getLeagueInfo`; none is written down here.** Craig, 6 Oct 2026: *"we need a section
that has the league points rules in it, maybe in draft section?"* (#293).

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- The Draft strip's sixth tab, Scoring, after Team Stats.
- One table. Its head is the slots the rules price, back to front (GK, DEF, MID, FWD): `scoredSlots` in core
  takes the keeper's letter and every outfield letter a rule names, never Fantrax's `Default` row, and
  `backToFront` orders them. The name column carries no plate, as on every board (DESIGN §2).
- One row per category, in plain words (`wordsOf`, so GA and GAO are one line, "Goals conceded"). Its `title`
  is the category's key line, as a board's key prints it.
- **Rewards before costs.** `rulesCard` puts every line whose payments are all negative at the foot.
- A price reads as Fantrax pays it: `+6`; a band as a range, the top one open (`1–59: +1`, `60+: +2`); a count
  paid every so many as `+1 per 3`; a slot paid nothing as `—`.
- **Said once where every slot is paid alike.** Minutes, assists, cards and own goals span the row in one cell
  rather than printing the same price four times.
- A category that pays no slot anything (CLRA, Pen in the real league) is left off.

## Whose rules

The scoring role's league, `"scoring": "real"` in `data/leagues/recorded.json`, read through `leagueScoring()`
(`app/scoring.ts`). It is the same rule set that prices every figure the app works out for itself (PLATFORM_NOTES,
*Every point we work out is priced by the real league's scoring*), so the card and our derived figures cannot
disagree. Fantrax's own points stay the served league's.

## States

| Screen | State | What it says |
|---|---|---|
| `/league/scoring` | the role names no league, or Fantrax describes no scoring | "No scoring to show" |

## The files

| File | Draws |
|---|---|
| `league/scoring/page.tsx` | the table |
| `packages/core/src/league/rulesCard.ts` | `scoredSlots` and `rulesCard`: the slots and the lines, pure and tested |
| `app/scoring.ts` | `leagueScoring()`, the cached read |
