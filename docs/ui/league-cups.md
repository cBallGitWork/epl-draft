# `/league/cups` — each cup's draw, round by round

The league's two cups, one at a time: every round, its gameweek and its ties. **The cups are ours,
not Fantrax's**, declared in `league/cups/declared.ts`; PLATFORM_NOTES' *The cups are declared as
ours* carries Craig's rules (27 Sep 2026).

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- Two pickers: the cup (Timbeibs Cup, Davy Propper Cup; `?cup=`) and the view (Fixtures, Bracket;
  `?view=`). The first of each is the default.
- One line on how the cup is played.
- **Fixtures** is the schedule's own list (`schedule/Round.tsx`), filtered to the cup: a gameweek head
  with its deadline, the cup and round on a plate, and a `ScoreRow` per tie with its number (M1…) where
  the `v` would be. Craig, 27 Sep 2026: *"Use similar UI to the league fixtures page."*
- **Bracket** draws each side of the draw as columns of ties, first round on the left, scrolling
  sideways on a phone: the winners' side (with the final) and the losers' side for the Timbeibs Cup,
  the two groups' slots and the knockout for the Davy Propper Cup. Craig: *"we really need a bracket
  view as well."*

## Placeholder draw

Craig, 27 Sep 2026: *"Placeholder brackets are fine for now."* Nobody is seeded until GW9 is
scored, and nobody is in a group until the draw around GW19, so every side is a placeholder:
"Seed 7", a group slot "A1", a group place "2nd B", or "Winner M5" / "Loser M5", M5 being the tie
numbered 5 on this page. Ties are numbered in the order they are played. The draw is laid out for
however many teams `getLeagueInfo` has, so a league still filling up gets a smaller bracket.

## States

- Fantrax silent: `getLeagueInfo` refused, so there is no team count to draw for.
- Fewer than two teams: "No draw yet".
