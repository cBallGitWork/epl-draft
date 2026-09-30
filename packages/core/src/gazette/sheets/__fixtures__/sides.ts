import type { FootballPlayer } from "../../../football/types";
import type { RosteredTeam } from "../../../join/roster";
import type { Sheet, SheetMan } from "../sheet";

// Test sides, each man written "name:slot:club".

export function footballer(code: number, name: string, clubId: number, over: Partial<FootballPlayer> = {}): FootballPlayer {
  return {
    id: code, code, name, fullName: name, clubId, status: "a", news: "", newsAdded: null, chanceOfPlaying: null,
    optaCode: null, birthDate: null, region: null,
    // Nothing here reads a season, so it is left empty.
    season: {} as FootballPlayer["season"],
    ...over,
  };
}

/** "Saka:M:1" is Saka, in the M slot, at club 1; his code and Fantrax id both come from his name. */
export function man(spec: string, over: Partial<FootballPlayer> = {}): SheetMan {
  const [name, slot, club] = spec.split(":");
  return { fantraxId: `fx-${name}`, slot, player: footballer(codeOf(name), name, Number(club), over) };
}

export function side(teamId: string, starters: readonly string[], bench: readonly string[] = []): Sheet {
  return { teamId, teamName: `Team ${teamId}`, starters: starters.map((spec) => man(spec)), bench: bench.map((spec) => man(spec)) };
}

/** The same side as Fantrax hands it over, for `sheetOf`. */
export function rostered(teamId: string, starters: readonly string[], bench: readonly string[] = []): RosteredTeam {
  const slot = (spec: string, status: string) => {
    const each = man(spec);
    return { slot: { fantraxId: each.fantraxId, position: each.slot, status }, player: each.player, stats: [] };
  };
  return { teamId, teamName: `Team ${teamId}`, players: [...bench.map((spec) => slot(spec, "RESERVE")), ...starters.map((spec) => slot(spec, "ACTIVE"))] };
}

export function codeOf(name: string): number {
  return [...name].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) % 100_000;
}
