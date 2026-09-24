import type { Opposition, PlTeamSheet, SquadPlayerDetail } from "@epl/core";
import type { LeagueOpinion } from "../../leagueOpinions";
import { backToFront } from "../../../positions";
import type { Match } from "./match";

// Each man in the match as the app's player card takes him, so a match opens the same card every squad does.

/** FPL codes by side: the men a team sheet named, or each club's whole squad before one is named. */
export interface SideCodes {
  home: readonly number[];
  away: readonly number[];
}

/** The men both team sheets named, eleven and bench. */
export function namedOn(sheets: { home: PlTeamSheet; away: PlTeamSheet }): SideCodes {
  const codes = (sheet: PlTeamSheet) =>
    [...sheet.lineup, ...sheet.substitutes].flatMap((man) => (man.code === null ? [] : [man.code]));
  return { home: codes(sheets.home), away: codes(sheets.away) };
}

/** Both clubs' whole squads, for a match nobody has named a side for yet. */
export function squadsOf(match: Match): SideCodes {
  const codes = (clubId: number | undefined) =>
    match.snapshot.players.filter((player) => player.clubId === clubId).map((player) => player.code);
  return { home: codes(match.home?.id), away: codes(match.away?.id) };
}

/** Every man's card, by FPL code. One our league does not list has no Fantrax profile and no card. */
export function matchCards(
  match: Match,
  sides: SideCodes,
  league: ReadonlyMap<number, LeagueOpinion>,
): Map<number, SquadPlayerDetail> {
  const cards = new Map<number, SquadPlayerDetail>();
  const both = [
    { codes: sides.home, club: match.home, other: match.away, home: true },
    { codes: sides.away, club: match.away, other: match.home, home: false },
  ];
  for (const { codes, club, other, home } of both) {
    const opposition: Opposition[] | undefined =
      other === undefined ? undefined : [{ club: other, home, difficulty: null, fixture: match.fixture }];
    for (const code of codes) {
      const player = match.byCode.get(code);
      const opinion = league.get(code);
      if (player === undefined || opinion === undefined) continue;
      const stats = match.figures.get(player.id);
      cards.set(code, {
        rostered: {
          // Our league's letters in pitch order, `M/F` for two, as the tile prints them; the card only prints it.
          slot: { fantraxId: opinion.fantraxId, position: backToFront(opinion.positions).join("/") || null, status: "" },
          player,
          stats: stats === undefined ? [] : [stats],
        },
        club,
        opposition,
        points: undefined,
      });
    }
  }
  return cards;
}
