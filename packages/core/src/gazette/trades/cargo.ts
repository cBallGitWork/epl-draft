import { textOrNull } from "../../untrusted";

// Here We Go's cargo: the side the lead man joined, for the picture's colours and name.

export interface StoryTransfer {
  /** The receiving side's Fantrax id, for its colours. */
  teamId: string;
  /** Its short name, as the paper prints it. */
  team: string;
}

/** Both fields or none: a picture with no side has no colours to print. */
export function normalizeTransfer(raw: unknown): StoryTransfer | undefined {
  const transfer = raw as Partial<StoryTransfer> | null;
  if (transfer === null || typeof transfer !== "object") return undefined;
  const teamId = textOrNull(transfer.teamId);
  const team = textOrNull(transfer.team);
  return teamId === null || team === null ? undefined : { teamId, team };
}
