import { shortName } from "../teamNames";

/** Whose item a Mail row says it is: "You" for the reader's own team, else the league's short name for it. */
export function ownerTag(
  teamId: string | null,
  mine: string | null,
  names: ReadonlyMap<string, string>,
): string | null {
  if (teamId === null) return null;
  if (teamId === mine) return "You";
  const full = names.get(teamId);
  return full === undefined ? null : shortName(teamId, full);
}
