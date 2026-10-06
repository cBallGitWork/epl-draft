// A manager's own FPL side. Its own adapter, because `football/` models the
// competition and this models one person's entry into a game played on top of it.

export { fetchEntry, fetchPicks } from "./client";
export { mapEntry, mapScoreLines, mapSquad } from "./map";
export { fplScoreName, isFplKeeper } from "./types";
export { fplLineup } from "./lineup";
export type { FplLine } from "./lineup";
export type { FplEntry, FplMiniLeague, FplPick, FplScoreLine, FplSquad } from "./types";
