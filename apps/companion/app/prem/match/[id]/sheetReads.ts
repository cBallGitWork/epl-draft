import type { SquadPlayerDetail } from "@epl/core";
import { leagueOpinions } from "../../leagueOpinions";
import { matchInjuries, matchManEvents, teamSheets } from "../../../matchDetail";
import type { Match } from "./match";
import { matchCards, namedOn } from "./matchCards";

/** What every tab built on the team sheets reads: the sheets, each man's events and injuries (one cached fixture
 *  detail behind all three), our league's view of the men, and each named man's card, none without a sheet. */
export async function sheetReads(match: Match) {
  const { gameweek, code } = match.fixture;
  const players = match.snapshot.players;
  const [sheets, events, injured, league] = await Promise.all([
    teamSheets(gameweek, code, players),
    matchManEvents(gameweek, code, players),
    matchInjuries(gameweek, code, players),
    leagueOpinions(),
  ]);
  const cards = sheets === null ? new Map<number, SquadPlayerDetail>() : matchCards(match, namedOn(sheets), league);
  return { sheets, events, injured, league, cards };
}
