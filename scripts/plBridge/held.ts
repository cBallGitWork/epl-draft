import { readJsonOr } from "../absent";

// The Premier League id → Opta code map as `npm run pl-bridge` last wrote it, which each run adds to.

export interface PlBridge {
  season: string;
  /** Premier League player id → Opta code. */
  players: Record<string, string>;
}

/** The map held at `path` for `season`; an empty one when there is no file or it is another season's (the ids are
 *  the Premier League's own and we have not probed whether they survive a summer). A file that will not parse throws. */
export async function heldBridge(path: string, season: string): Promise<PlBridge> {
  const held = readJsonOr<PlBridge | null>(path, null);
  return held !== null && held.season === season ? held : { season, players: {} };
}
