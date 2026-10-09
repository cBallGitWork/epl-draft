import { sumOf } from "../sum";
import type { RawClassicLeague, RawEntry, RawLiveExplain, RawPicks } from "./raw";
import type { FplEntry, FplMiniLeague, FplPick, FplScoreLine, FplSquad } from "./types";
// A manager's entry, cleaned but not interpreted: a pre-season null stays null, since it is not "scored nothing".

export function mapEntry(raw: RawEntry): FplEntry {
  return {
    id: raw.id ?? 0,
    managerName: [raw.player_first_name, raw.player_last_name].filter(Boolean).join(" "),
    teamName: raw.name ?? "",
    overallPoints: raw.summary_overall_points ?? null,
    overallRank: raw.summary_overall_rank ?? null,
    gameweekPoints: raw.summary_event_points ?? null,
    currentEvent: raw.current_event ?? null,
    leagues: (raw.leagues?.classic ?? []).flatMap(mapLeague),
  };
}

function mapLeague(raw: RawClassicLeague): FplMiniLeague[] {
  if (raw.id === undefined) return [];
  return [
    {
      id: raw.id,
      name: raw.name ?? "",
      // Zero is FPL's placeholder for an unranked entry pre-season, not a rank.
      rank: raw.entry_rank || null,
      lastRank: raw.entry_last_rank || null,
      kind: raw.league_type ?? "",
    },
  ];
}

/** The fifteen, with FPL's own points already multiplied. The caller supplies `linesFor` (the live feed is the
 *  football layer's read) and `codeFor`, since element ids are per-season and must never leave here. */
export function mapSquad(
  raw: RawPicks,
  codeFor: (element: number) => number | null,
  linesFor: (element: number) => FplScoreLine[],
): FplSquad | null {
  const gameweek = raw.entry_history?.event;
  if (gameweek === undefined) return null;

  const picks: FplPick[] = (raw.picks ?? []).flatMap((pick) => {
    if (pick.element === undefined) return [];
    const code = codeFor(pick.element);
    // A pick we cannot name is dropped, not drawn blank; the total comes from FPL either way.
    if (code === null) return [];

    const multiplier = pick.multiplier ?? 0;
    const lines = linesFor(pick.element);
    const scored = sumOf(lines, (line) => line.points);
    return [
      {
        code,
        // Zero when omitted, which sorts as a starter: better the wrong half of the squad than a fifteen shown as fourteen.
        slot: pick.position ?? 0,
        // Zero when omitted, which `fplLineup` stands in a row of its own rather than dropping.
        line: pick.element_type ?? 0,
        multiplier,
        isCaptain: pick.is_captain ?? false,
        isViceCaptain: pick.is_vice_captain ?? false,
        points: scored * multiplier,
        scored,
        lines,
      },
    ];
  });

  return {
    gameweek,
    picks,
    // FPL's own total, never our sum: autosubs and transfer hits both move it.
    total: raw.entry_history?.points ?? null,
    hit: raw.entry_history?.event_transfers_cost ?? null,
  };
}

/** Every man's FPL scoring lines for a round, by element id, a double's fixtures merged by
 *  identifier in the order FPL first lists them. Keyed by the per-season id: never persisted. */
export function mapScoreLines(raw: RawLiveExplain): Record<number, FplScoreLine[]> {
  const out: Record<number, FplScoreLine[]> = {};
  for (const element of raw.elements ?? []) {
    if (element.id === undefined) continue;
    const merged = new Map<string, FplScoreLine>();
    for (const stat of (element.explain ?? []).flatMap((block) => block.stats ?? [])) {
      if (stat.identifier === undefined) continue;
      const line = merged.get(stat.identifier) ?? { identifier: stat.identifier, value: 0, points: 0 };
      merged.set(stat.identifier, {
        ...line,
        value: line.value + (stat.value ?? 0),
        points: line.points + (stat.points ?? 0),
      });
    }
    out[element.id] = [...merged.values()];
  }
  return out;
}
