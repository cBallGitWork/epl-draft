// A manager's own FPL side. Its own adapter, because `football/` models the
// competition and this models one person's entry into a game played on top of it.

export { fetchEntry, fetchEntryLines, fetchEntryPoints, fetchPicks } from "./client";
export { mapEntry, mapSquad } from "./map";
export { FPL_LINES, FPL_STARTERS, isFplKeeper } from "./types";
export { fplLineup } from "./lineup";
export type { FplLine } from "./lineup";
export type { FplEntry, FplMiniLeague, FplPick, FplSquad } from "./types";
