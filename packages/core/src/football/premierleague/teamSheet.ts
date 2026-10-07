import type { RawPlFixture, RawPlSquadPlayer } from "./raw";

// Who was named for one match, and the shape they were named in.

/** Premier League player id → FPL `code` for both squads, via a caller's `opta_code` → `code` map.
 *  Harvested from the team sheets, not `/players`, which lags squad registration and misses men who score. */
export function plPlayerCodes(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): Map<number, number> {
  const codes = new Map<number, number>();
  for (const list of fixture.teamLists ?? []) {
    // A side nobody has named yet is a null entry: reading `list.lineup` throws on every unstarted fixture.
    if (list === null || list === undefined) continue;
    for (const player of [...list.lineup, ...list.substitutes]) {
      const opta = player.altIds?.opta;
      const code = opta === undefined ? undefined : optaToCode.get(opta);
      if (code !== undefined) codes.set(player.id, code);
    }
  }
  return codes;
}

/** A man's FPL code from his Premier League id, or null when the feed names nobody or the bridge cannot place him. */
export function codeOf(codes: ReadonlyMap<number, number>, id: number | undefined): number | null {
  return id === undefined ? null : (codes.get(id) ?? null);
}

/** One man as a team sheet names him, joined to FPL where the bridge can. */
export interface PlSquadMan {
  /** FPL's season-stable `code`, or null when FPL does not list him yet. He keeps his name either way. */
  code: number | null;
  name: string;
  /** The number on his back in THIS match, or null when the payload gave none (drawn as an empty block). */
  shirt: number | null;
  /** The position he was NAMED in for this match (`G`, `D`, `M`, `F`), a football fact and not FPL's `element_type`. */
  position: string | null;
  captain: boolean;
}

/** A side's sheet: who started, who sat, and the shape. */
export interface PlTeamSheet {
  /** The Premier League's own team id, which is what `teamLists` is keyed on. */
  teamId: number;
  lineup: PlSquadMan[];
  substitutes: PlSquadMan[];
  /** `"4-2-3-1"`, or null for a fixture whose sheet carries no formation. */
  formation: string | null;
  /** The formation drawn as rows of men, keeper first; null whenever `formation` is.
   *  A grid id missing from `lineup` is dropped, never drawn as a gap. */
  shape: PlSquadMan[][] | null;
}

/** Both sides' team sheets, home first off `teams` (so no sheet sits under the wrong crest): our only unused subs.
 *  Null when no side is named yet, so "not published" differs from "eleven men and no bench". */
export function plTeamSheets(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): { home: PlTeamSheet; away: PlTeamSheet } | null {
  // Not `length === 0`: an unnamed fixture answers `[null, null]`, two entries and no sheets.
  const lists = (fixture.teamLists ?? []).filter((entry) => entry !== null && entry !== undefined);
  if (lists.length === 0) return null;

  const sheetFor = (teamId: number): PlTeamSheet | null => {
    const list = lists.find((entry) => entry.teamId === teamId);
    if (list === undefined) return null;

    // The pitch and the list share these objects, so one man is one value.
    const byId = new Map(list.lineup.map((man) => [man.id, squadMan(man, optaToCode)]));
    const grid = list.formation?.players;

    return {
      teamId,
      lineup: [...byId.values()],
      substitutes: list.substitutes.map((man) => squadMan(man, optaToCode)),
      formation: list.formation?.label ?? null,
      shape:
        grid === undefined
          ? null
          : grid.map((line) =>
              line.flatMap((id) => {
                const man = byId.get(id);
                return man === undefined ? [] : [man];
              }),
            ),
    };
  };

  const [home, away] = (fixture.teams ?? []).map((side) => sheetFor(side.team.id));
  return home == null || away == null ? null : { home, away };
}

function squadMan(man: RawPlSquadPlayer, optaToCode: Map<string, number>): PlSquadMan {
  const opta = man.altIds?.opta;
  return {
    code: (opta === undefined ? undefined : optaToCode.get(opta)) ?? null,
    name: man.name.display,
    shirt: man.matchShirtNumber ?? null,
    position: man.matchPosition ?? null,
    captain: man.captain === true,
  };
}
