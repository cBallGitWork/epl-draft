import type { RawClassicLeague, RawEntry, RawPicks } from "./raw";
import type { FplEntry, FplMiniLeague, FplPick, FplSquad } from "./types";

// Pure. Everything a manager's entry says about itself, cleaned but not
// interpreted — pre-season nulls stay null, because "has not played yet" and
// "scored nothing" are different answers.

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
      // Zero is FPL's placeholder for an unranked entry pre-season, and a rank of
      // nought is not a rank. Null says so.
      rank: raw.entry_rank || null,
      lastRank: raw.entry_last_rank || null,
      kind: raw.league_type ?? "",
    },
  ];
}

/** The fifteen, with FPL's own points already multiplied.
 *
 *  `pointsFor` resolves an element id to that player's FPL points for the round;
 *  the caller supplies it, because the live feed is the football layer's read and
 *  this adapter has no business fetching it. Same for `codeFor`: element ids are
 *  per-season and must never leave here. */
export function mapSquad(
  raw: RawPicks,
  codeFor: (element: number) => number | null,
  pointsFor: (element: number) => number,
): FplSquad | null {
  const gameweek = raw.entry_history?.event;
  if (gameweek === undefined) return null;

  const picks: FplPick[] = (raw.picks ?? []).flatMap((pick) => {
    if (pick.element === undefined) return [];
    const code = codeFor(pick.element);
    // A pick we cannot name is dropped rather than rendered blank: it is one of
    // fifteen and the total below comes from FPL either way.
    if (code === null) return [];

    const multiplier = pick.multiplier ?? 0;
    return [
      {
        code,
        multiplier,
        isCaptain: pick.is_captain ?? false,
        isViceCaptain: pick.is_vice_captain ?? false,
        points: pointsFor(pick.element) * multiplier,
      },
    ];
  });

  return {
    gameweek,
    picks,
    // FPL's own total, never our sum: autosubs and transfer hits both move it,
    // and adding up the picks would disagree with the app they are looking at.
    total: raw.entry_history?.points ?? null,
    hit: raw.entry_history?.event_transfers_cost ?? null,
  };
}
