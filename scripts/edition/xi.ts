import {
  isResolved,
  predictedLineups,
  squadIntel,
  type Club,
  type Fixture,
  type IntelSquads,
  type IntelXi,
  type RosteredTeam,
  type StoryLineupMan,
} from "@epl/core";
import { INTEL_SEASON, readIntel } from "../intel";
import { roundTies } from "./round";
import { display } from "./pressers";

// The predicted elevens, printed from the export rather than written from it.
//
// **No model call.** Every word of this column is a name, a position or a
// count, and a writer handed two hundred and twenty footballers can only
// mis-transcribe them — the same argument that deleted the eleven's captions.

/** Scout's latest elevens when they were made for this round, else null: the column is filed as
 *  that round's predictions, so an older eleven would print a wrong fact. The app draws it anyway. */
export function readXi(gameweek: number): IntelXi | null {
  const xi = readIntel<IntelXi>("xi", `${INTEL_SEASON}.json`);
  return xi?.manifest?.gameweek === gameweek ? xi : null;
}

/** The whole column, ready to file. Null when the ties or the elevens will not
 *  come, which files nothing and spends nothing. */
export function xiColumn(input: {
  xi: IntelXi;
  gameweek: number;
  clubs: ReadonlyMap<number, Club>;
  teams: readonly RosteredTeam[];
  players: readonly { code: number; name: string; fullName: string }[];
  season: readonly Fixture[];
}): Record<string, unknown> | null {
  const { xi, gameweek, clubs, teams, players, season } = input;

  const ties = roundTies(gameweek, clubs, season);
  const lineups = predictedLineups(ties, xi, man(players, teams, xi));
  if (lineups.length === 0) return null;

  const printed =
    lineups.length === ties.length
      ? `All ${ties.length} of the round's matches`
      : `${lineups.length} of the round's ${ties.length} matches`;

  return {
    headline: `Predicted Line-Ups: Gameweek ${gameweek}`,
    deck: `Every club's expected starting eleven for the round, match by match.`,
    body: `${printed}, with both sides named.`,
    lineups,
  };
}

/** How to print one starter: his name, his real position, and who holds him.
 *
 *  The position comes off the SQUADS export and is null wherever that export
 *  had only FPL's `element_type` — a fantasy letter is not a fact about a
 *  footballer, so it prints as nothing rather than as a position. */
function man(
  players: readonly { code: number; name: string; fullName: string }[],
  teams: readonly RosteredTeam[],
  xi: IntelXi,
): (code: number) => StoryLineupMan | null {
  const byCode = new Map(players.map((player) => [player.code, player]));
  const squads = squadIntel(readSquads(xi.manifest.season));
  const held = owners(teams);

  return (code) => {
    const player = byCode.get(code);
    if (player === undefined) return null;
    const owner = held.get(code);
    return {
      name: display(player),
      position: squads.get(code)?.position ?? null,
      ...(owner === undefined ? {} : { owner }),
    };
  };
}

/** Every code somebody in the league holds, and the team id that holds him —
 *  the id and not the name, which goes stale the day a manager renames. */
function owners(teams: readonly RosteredTeam[]): Map<number, string> {
  const out = new Map<number, string>();
  for (const team of teams) {
    for (const player of team.players.filter(isResolved)) {
      out.set(player.player.code, team.teamId);
    }
  }
  return out;
}

/** The squads for the season the XI itself names, so the two exports cannot be
 *  read from different years. */
function readSquads(season: string): IntelSquads | null {
  return readIntel<IntelSquads>("squads", `${season}.json`);
}

