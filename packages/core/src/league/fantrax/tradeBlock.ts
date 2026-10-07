import type { BlockPlayer, TradeBlock } from "../types";

// `getTradeBlocks` → each team's trade block. Members only, so it is read with the commissioner's session.
// Shape off the trade-block page's own template (`chunk-IJUVPJCK.js`, 7 Oct 2026); stats are not read.

/** A footballer as the block lists him; `teamId` is his CLUB's Fantrax id, never a fantasy team. */
interface RawBlockScorer {
  scorerId?: string;
  name?: string;
  posShortNames?: string;
  teamShortName?: string;
  teamName?: string;
}

/** One list on a block, filed under the position ids it covers. */
interface RawBlockScorers {
  scorers?: Record<string, RawBlockScorer[] | undefined>;
}

interface RawBlockPositions {
  positions?: string[];
}

interface RawBlock {
  teamId?: string;
  /** `date` is epoch milliseconds. */
  lastUpdated?: { date?: number };
  comment?: { body?: string };
  scorersOffered?: RawBlockScorers;
  scorersWanted?: RawBlockScorers;
  positionsOffered?: RawBlockPositions;
  positionsWanted?: RawBlockPositions;
}

export interface RawTradeBlocks {
  tradeBlocks?: RawBlock[];
}

/** `getRefObject {type: "Position"}`: every position Fantrax knows, by id ("703" is Defender). Public. */
export interface RawPositionRefs {
  allObjs?: Record<string, { id?: string; name?: string } | undefined>;
}

/** Position names by id, in Fantrax's words. */
export function mapPositionNames(raw: RawPositionRefs): Map<string, string> {
  const names = new Map<string, string>();
  for (const [id, position] of Object.entries(raw.allObjs ?? {})) {
    if (position?.name) names.set(id, position.name);
  }
  return names;
}

/** Every team's block that says something; a position Fantrax does not name is left out rather than guessed. */
export function mapTradeBlocks(raw: RawTradeBlocks, positionNames: ReadonlyMap<string, string>): TradeBlock[] {
  const named = (list: RawBlockPositions | undefined) =>
    (list?.positions ?? []).map((id) => positionNames.get(id)).filter((name) => name !== undefined);

  return (raw.tradeBlocks ?? []).flatMap((block) => {
    if (!block.teamId) return [];
    const date = block.lastUpdated?.date;
    const mapped: TradeBlock = {
      teamId: block.teamId,
      updatedAt: typeof date === "number" && Number.isFinite(date) ? new Date(date).toISOString() : null,
      offered: players(block.scorersOffered),
      wanted: players(block.scorersWanted),
      positionsOffered: named(block.positionsOffered),
      positionsWanted: named(block.positionsWanted),
      comment: block.comment?.body?.trim() || null,
    };
    const empty = [mapped.offered, mapped.wanted, mapped.positionsOffered, mapped.positionsWanted].every(
      (list) => list.length === 0,
    );
    return empty && mapped.comment === null ? [] : [mapped];
  });
}

/** The men on one list, once each, should a man eligible at two positions be filed under both. */
function players(list: RawBlockScorers | undefined): BlockPlayer[] {
  const seen = new Map<string, BlockPlayer>();
  for (const scorer of Object.values(list?.scorers ?? {}).flatMap((group) => group ?? [])) {
    if (!scorer.scorerId || seen.has(scorer.scorerId)) continue;
    seen.set(scorer.scorerId, {
      fantraxId: scorer.scorerId,
      playerName: scorer.name ?? "",
      position: scorer.posShortNames ?? null,
      club: scorer.teamShortName ?? null,
      clubName: scorer.teamName ?? null,
    });
  }
  return [...seen.values()];
}
