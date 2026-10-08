import {
  owners,
  predictedLineups,
  squadIntel,
  type Club,
  type Fixture,
  type IntelSquads,
  type IntelXi,
  type RosteredTeam,
  type StoryLineupMan,
} from "@epl/core";
import { readIntel } from "../intel";
import { roundTies } from "./round";
import { display } from "./pressers";

// The predicted elevens, printed from the export and never written from it: no model call, since every word is a name,
// a position or a count, and a writer handed two hundred and twenty footballers can only mis-transcribe them.

/** Scout's latest elevens when they were made for this round, else null: the column is filed as
 *  that round's predictions, so an older eleven would print a wrong fact. The app draws it anyway. */
export function readXi(gameweek: number): IntelXi | null {
  const xi = readIntel<IntelXi>("xi");
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

/** One starter as printed: his name, who holds him, and his real position off the SQUADS export, nothing where that
 *  had only FPL's `element_type`, which is a fantasy letter, not a fact about a footballer. */
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
    // The id, never the name, which goes stale the day a manager renames.
    const owner = held.get(code)?.teamId;
    return {
      name: display(player),
      position: squads.get(code)?.position ?? null,
      ...(owner === undefined ? {} : { owner }),
    };
  };
}

/** The squads for the season the XI itself names, so the two exports cannot be
 *  read from different years. */
function readSquads(season: string): IntelSquads | null {
  return readIntel<IntelSquads>("squads", season);
}

