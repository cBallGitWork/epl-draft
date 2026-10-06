import type { PoolPlayer } from "@epl/core";
import { STATUS } from "./status";

// Who holds a man, as a Data board prints it in brackets after his name.

export type Held = Pick<PoolPlayer, "ownerTeamId" | "status">;

export interface Holder {
  text: string;
  title: string;
  /** The reader's own man, a rival's, or one anybody can claim. */
  tone: "yours" | "rival" | "free";
}

/** "Yours", the holding team's name, or Fantrax's status code for a man nobody holds; null when it has none. */
export function holderOf(held: Held, teamNames: ReadonlyMap<string, string>, reader: string | null): Holder | null {
  const owner = held.ownerTeamId;
  if (owner !== null && owner === reader) return { text: "Yours", title: "Yours", tone: "yours" };
  if (owner !== null) {
    const name = teamNames.get(owner) ?? owner;
    return { text: name, title: name, tone: "rival" };
  }
  return held.status ? { text: held.status, title: STATUS[held.status] ?? held.status, tone: "free" } : null;
}
