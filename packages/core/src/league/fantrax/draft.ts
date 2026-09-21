import type { RawDraftResults } from "./raw";

// `getDraftResults` → who was taken where.
//
// The one fact a draft league has that no other fantasy format does: every
// player on every squad has a price somebody paid in draft position, and the
// gap between that price and what he actually did is the league's whole
// conversation. A 14th-rounder outscoring the first pick is a story; the first
// pick doing what he was taken to do is not.
//
// **It joins with no bridge.** `playerId` here is a Fantrax pool id, the same id
// the rosters and the transaction log carry, so pedigree meets a squad directly
// — this is entirely inside the league layer and never touches the football one.
//
// A player with no pick was never drafted: he came off the waiver wire, which is
// its own kind of pedigree and a different story.

/** Where one player was taken. */
export interface DraftPick {
  fantraxId: string;
  teamId: string;
  /** 1-based, as Fantrax numbers them. */
  round: number;
  /** Overall, across every round — so pick 1 is the first name called all night. */
  overall: number;
}

export function mapDraftPicks(raw: RawDraftResults): DraftPick[] {
  // A draft still running is a partial list, and a partial list is a wrong
  // pedigree rather than a short one: everyone not yet taken would read as
  // undrafted. Nine weeks of the real league's season are in that state.
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
