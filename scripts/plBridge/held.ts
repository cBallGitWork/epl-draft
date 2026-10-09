import { readFile } from "node:fs/promises";

// The Premier League id → Opta code map as `npm run pl-bridge` last wrote it, which each run adds to.

export interface PlBridge {
  season: string;
  /** Premier League player id → Opta code. */
  players: Record<string, string>;
}

/** The map held at `path` for `season`; an empty one when there is none, or it is another season's (the ids are the
 *  Premier League's own and we have not probed whether they survive a summer). */
export async function heldBridge(path: string, season: string): Promise<PlBridge> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as PlBridge;
    return parsed.season === season ? parsed : { season, players: {} };
  } catch {
    // No file yet is the ordinary first run, not a failure to swallow.
    return { season, players: {} };
  }
}
