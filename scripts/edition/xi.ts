import {
  availabilityOf,
  owners,
  predictedLineups,
  squadIntel,
  type Club,
  type Fixture,
  type FootballPlayer,
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

/** Scout's latest elevens when they were made for this gameweek, else null: the column is filed as
 *  that gameweek's predictions, so an older eleven would print a wrong fact. The app draws it anyway. */
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
  players: readonly XiPlayer[];
  season: readonly Fixture[];
}): Record<string, unknown> | null {
  const { xi, gameweek, clubs, teams, players, season } = input;

  const ties = roundTies(gameweek, clubs, season);
  const lineups = predictedLineups(ties, xi, man(players, teams, xi));
  if (lineups.length === 0) return null;

  const printed =
    lineups.length === ties.length
      ? `All ${ties.length} of the gameweek's matches`
      : `${lineups.length} of the gameweek's ${ties.length} matches`;

  return {
    headline: `Predicted Line-Ups: Gameweek ${gameweek}`,
    deck: `Every club's expected starting eleven for the gameweek, match by match.`,
    body: `${printed}, with both sides named.`,
    lineups,
  };
}

/** What the desk reads of a footballer: his names, and his fitness. */
type XiPlayer = Pick<FootballPlayer, "code" | "name" | "fullName" | "status" | "news" | "chanceOfPlaying">;

/** One starter as printed: his name, who holds him, his real position off the SQUADS export (nothing where that had
 *  only FPL's `element_type`), and OUT or Doubt where the football says so. The eleven is never changed. */
function man(
  players: readonly XiPlayer[],
  teams: readonly RosteredTeam[],
  xi: IntelXi,
): (code: number) => StoryLineupMan | null {
  const byCode = new Map(players.map((player) => [player.code, player]));
  // The squads for the season the XI itself names, so the two exports cannot be read from different years.
  const squads = squadIntel(readIntel<IntelSquads>("squads", xi.manifest.season));
  const held = owners(teams);

  return (code) => {
    const player = byCode.get(code);
    if (player === undefined) return null;
    // The id, never the name, which goes stale the day a manager renames.
    const owner = held.get(code)?.teamId;
    const fitness = availabilityOf(player);
    return {
      name: display(player),
      position: squads.get(code)?.position ?? null,
      ...(owner === undefined ? {} : { owner }),
      ...(fitness.out ? { status: "OUT" } : fitness.state === "doubt" ? { status: "Doubt" } : {}),
    };
  };
}

