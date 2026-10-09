import { createHash } from "node:crypto";
import {
  availabilityOf,
  elevensKey,
  owners,
  predictedLineups,
  roundSlot,
  squadIntel,
  type Club,
  type Fixture,
  type FootballPlayer,
  type IntelSquads,
  type IntelXi,
  type LineupStatus,
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

/** The Line-Ups' covered-key, one per telling: a changed export spends a new key and refiles under the round's slug.
 *  `fetchedAt` moves only when the elevens do, so elevens that change and change back still refile. */
export function lineupsSlot(gameweek: number, xi: IntelXi): { key: string; slug: string } {
  const slot = roundSlot("predicted-xi", gameweek);
  const telling = createHash("sha256").update(`${xi.fetchedAt ?? ""}\n${elevensKey(xi.clubs)}`).digest("hex").slice(0, 8);
  return { key: `${slot.key}:${telling}`, slug: slot.slug };
}

/** The whole column, ready to file, and who it starts by code for its picture. Null when the ties or the elevens will
 *  not come, which files nothing and spends nothing. */
export function xiColumn(input: {
  xi: IntelXi;
  gameweek: number;
  clubs: ReadonlyMap<number, Club>;
  teams: readonly RosteredTeam[];
  players: readonly XiPlayer[];
  season: readonly Fixture[];
}): { column: Record<string, unknown>; starters: ReadonlySet<number> } | null {
  const { xi, gameweek, clubs, teams, players, season } = input;

  const ties = roundTies(gameweek, clubs, season);
  const lineups = predictedLineups(ties, xi, man(players, teams, xi));
  if (lineups.length === 0) return null;

  // Read back off the export by each printed side's club, so a club whose tie did not print starts nobody.
  const starters = lineups
    .flatMap((tie) => [tie.home, tie.away])
    .flatMap((side) => xi.clubs?.[clubs.get(side.code)?.shortName ?? ""]?.starters ?? [])
    .map((starter) => starter.code);

  return {
    column: {
      headline: `Predicted Line-Ups: Gameweek ${gameweek}`,
      deck: `Every club's expected starting eleven for the gameweek.`,
      lineups,
    },
    starters: new Set(starters),
  };
}

/** What the desk reads of a footballer: his names, and his fitness. */
type XiPlayer = Pick<FootballPlayer, "code" | "name" | "fullName" | "status" | "news" | "newsAdded" | "chanceOfPlaying">;

/** One source's word on a man: a mark or none (fit), and when it was said; null when it says nothing of him. */
type Signal = { mark: LineupStatus | null; at: string | null } | null;

/** One mark from FPL's and RotoWire's words: the fresher wins where both speak, an undated word losing. */
export function freshestMark(fpl: Signal, rotowire: Signal): LineupStatus | null {
  if (fpl === null || rotowire === null) return (fpl ?? rotowire)?.mark ?? null;
  const [fplAt, rotowireAt] = [Date.parse(fpl.at ?? ""), Date.parse(rotowire.at ?? "")];
  if (Number.isNaN(fplAt)) return rotowire.mark ?? fpl.mark;
  if (Number.isNaN(rotowireAt)) return fpl.mark ?? rotowire.mark;
  return rotowireAt > fplAt ? rotowire.mark : fpl.mark;
}

/** RotoWire's word on each man of a club it covered, dated when the file first held it; Scout's clubs say nothing. */
function rotowireSignals(xi: IntelXi): (code: number) => Signal {
  const said = new Map<number, Signal>();
  for (const club of Object.values(xi.clubs ?? {})) {
    if (club.absent === undefined) continue;
    for (const man of club.starters) said.set(man.code, { mark: null, at: xi.fetchedAt });
    for (const man of club.absent) said.set(man.code, { mark: man.status === "OUT" ? "OUT" : "Doubt", at: xi.fetchedAt });
  }
  return (code) => said.get(code) ?? null;
}

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
  const rotowire = rotowireSignals(xi);

  return (code) => {
    const player = byCode.get(code);
    if (player === undefined) return null;
    // The id, never the name, which goes stale the day a manager renames.
    const owner = held.get(code)?.teamId;
    const fitness = availabilityOf(player);
    const fpl = fitness.out ? "OUT" : fitness.state === "doubt" ? "Doubt" : null;
    const status = freshestMark({ mark: fpl, at: player.newsAdded }, rotowire(code));
    return {
      name: display(player),
      position: squads.get(code)?.position ?? null,
      ...(owner === undefined ? {} : { owner }),
      ...(status === null ? {} : { status }),
    };
  };
}

