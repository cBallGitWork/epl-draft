import type { RawDraftResults } from "./raw";

// `getDraftResults` → who was taken where. `playerId` is a pool id, so it joins rosters with no bridge.
// A player with no pick was never drafted.

/** Where one player was taken. */
export interface DraftPick {
  fantraxId: string;
  teamId: string;
  /** 1-based, as Fantrax numbers them. */
  round: number;
  /** Overall, across every round: pick 1 is the first name called. */
  overall: number;
}

export function mapDraftPicks(raw: RawDraftResults): DraftPick[] {
  // A running draft is a partial list, which would read everyone not yet taken as undrafted.
  if (raw.draftState !== "completed") return [];

  return (raw.draftPicks ?? []).flatMap((pick) => {
    if (
      typeof pick?.playerId !== "string" ||
      typeof pick.teamId !== "string" ||
      typeof pick.round !== "number" ||
      typeof pick.pick !== "number"
    ) {
      return [];
    }
    return [{ fantraxId: pick.playerId, teamId: pick.teamId, round: pick.round, overall: pick.pick }];
  });
}
