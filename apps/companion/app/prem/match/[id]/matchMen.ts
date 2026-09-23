import type { Opposition, PlTeamSheet, SquadPlayerDetail } from "@epl/core";
import type { LeagueOpinion } from "../../club/[code]/club";
import type { Match } from "./match";

// Each named man as the app's player card takes him, so a match opens the same card every squad does.

/** Every named man's card, by FPL code. One our league does not list has no Fantrax profile and no card. */
export function matchMen(
  match: Match,
  sheets: { home: PlTeamSheet; away: PlTeamSheet },
  league: ReadonlyMap<number, LeagueOpinion>,
): Map<number, SquadPlayerDetail> {
  const men = new Map<number, SquadPlayerDetail>();
  const sides = [
    { sheet: sheets.home, club: match.home, other: match.away, home: true },
    { sheet: sheets.away, club: match.away, other: match.home, home: false },
  ];
  for (const { sheet, club, other, home } of sides) {
    const opposition: Opposition[] | undefined =
      other === undefined ? undefined : [{ club: other, home, difficulty: null, fixture: match.fixture }];
    for (const man of [...sheet.lineup, ...sheet.substitutes]) {
      if (man.code === null) continue;
      const player = match.byCode.get(man.code);
      const opinion = league.get(man.code);
      if (player === undefined || opinion === undefined) continue;
      const stats = match.figures.get(player.id);
      men.set(man.code, {
        rostered: {
          // Our league's letters, `M/F` for two, which is all the card does with a slot's position: print it.
          slot: { fantraxId: opinion.fantraxId, position: opinion.positions.join("/") || null, status: "" },
          player,
          stats: stats === undefined ? [] : [stats],
        },
        club,
        opposition,
        points: undefined,
      });
    }
  }
  return men;
}
