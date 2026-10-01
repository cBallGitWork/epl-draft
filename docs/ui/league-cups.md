# `/league/cups` — each cup's draw

The league's two cups, one at a time: the draw, round by round. **The cups are ours, not Fantrax's**,
declared in `league/cups/declared.ts`; PLATFORM_NOTES' *The cups are declared as ours* carries Craig's
rules (27 Sep 2026). Their fixtures are on the schedule (`/league/schedule`), not here.

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- One picker: the cup (Timbeibs Cup, Davy Propper Cup; `?cup=`), the first by default. Craig, 1 Oct
  2026: *"just put fixtures in fixtures section, too many buttons, leave brackets here"*. The Fixtures
  view went, and with it the view picker; an old `?view=` link is ignored.
- **The Timbeibs Cup** is two brackets, each side of the draw as columns of ties, first round on the
  left, scrolling sideways on a phone: the winners' side (with the final) and the losers' side. Craig,
  27 Sep: *"we really need a bracket view as well."*
- **The Davy Propper Cup** is its two groups as league tables (Craig, 1 Oct: *"propper cup should be a
  table view"*), then its knockout as a bracket. A group's columns are the league table's (Pld W D L
  For Ag Pts, Ag standing down under a thumb), its rows the draw slots A1–A5 placed by `groupTable`,
  and a dashed line under the last place through to the knockout. Until the group stage is played every
  figure is 0: no group tie has a result to count.

## Placeholder draw

Craig, 27 Sep 2026: *"Placeholder brackets are fine for now."* Nobody is seeded until GW9 is
scored, and nobody is in a group until the draw around GW19, so every side is a placeholder:
"Seed 7", a group slot "A1", a group place "2nd B", or "Winner M5" / "Loser M5", M5 being the tie
numbered 5 in the bracket. A round drawn at random (the Timbeibs Cup's first two) prints "To be drawn"
on both sides until Craig's draw fills it. Ties are numbered in the order they are played. The draw is laid out for
however many teams `getLeagueInfo` has, so a league still filling up gets a smaller bracket.

## States

- Fantrax silent: `getLeagueInfo` refused, so there is no team count to draw for.
- Fewer than two teams: "No draw yet".
