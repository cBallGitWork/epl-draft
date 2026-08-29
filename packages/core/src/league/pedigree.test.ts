import { describe, expect, it } from "vitest";
import { pedigreeOf } from "./pedigree";
import { mapDraftPicks } from "./fantrax/draft";
import type { RawDraftResults } from "./fantrax/raw";
import { mapPoolStats } from "./fantrax/stats";
import type { RawPoolStats } from "./fantrax/stats";
import type { PoolStatRow } from "./stats";
import draftCompleted from "./fantrax/__fixtures__/draftCompleted.json";
import draftResults from "./fantrax/__fixtures__/draftResults.json";
import poolStats from "./fantrax/__fixtures__/poolStats.json";

// The rehearsal league's real draft — 60 picks, completed — against the pool
// table Fantrax scores it with. The three men the stats fixture carries went at
// picks 1, 2 and 6 and stand 1st, 2nd and 3rd on Fantrax's own ranking, which is
// what makes one of them a steal and the other two exactly what they cost.

const picks = mapDraftPicks(draftCompleted as RawDraftResults);
const scored = mapPoolStats(poolStats as unknown as RawPoolStats).rows;

const FIRST = "061vq";
const SIXTH = "04qr9";

describe("pedigreeOf", () => {
  it("puts the round and the overall pick on a man who was taken", () => {
    expect(pedigreeOf(FIRST, picks, scored)).toMatchObject({
      origin: "draft",
      round: 1,
      overall: 1,
      teamId: "8enbgqo5msgb375j",
    });
  });

  // Pick 6 standing 3rd among the drafted is three picks of value; the No.1 pick
  // standing 1st is exactly what he cost, and nought here is a real answer.
  it("measures him against his pick rather than against the pool", () => {
    expect(pedigreeOf(SIXTH, picks, scored)).toMatchObject({ overall: 6, against: 3 });
    expect(pedigreeOf(FIRST, picks, scored)).toMatchObject({ overall: 1, against: 0 });
  });

  it("calls an undrafted man a waiver pickup rather than a hole in the draft", () => {
    expect(pedigreeOf("nobody", picks, scored)).toEqual({ origin: "waiver" });
  });

  // The state our real league is in until 10 Oct, and the reason "waiver" and
  // "we cannot say" are different answers. `mapDraftPicks` refuses a draft that
  // is still running, so this arrives as no picks at all — and filing all 671
  // players as waiver pickups would be a confident wrong answer about every one
  // of them.
  it("says nothing at all when there is no draft to read", () => {
    expect(mapDraftPicks(draftResults as RawDraftResults)).toEqual([]);
    expect(pedigreeOf(FIRST, [], scored)).toEqual({ origin: "unknown" });
  });

  // Nought would read as "exactly par", which is what the No.1 pick above
  // genuinely is. A man nobody has scored is not par.
  it("dashes the value rather than calling an unscored man par", () => {
    expect(pedigreeOf(FIRST, picks, [])).toMatchObject({ origin: "draft", against: null });
  });

  it("ranks only the drafted men Fantrax has a rank for", () => {
    // Drop the top of the ranking: the sixth pick moves up to second of the two
    // that remain, and is worth four picks rather than three. Everyone below a
    // man Fantrax cannot score moves up, which is why this figure is a
    // comparison and never a claim about him on his own.
    const short: PoolStatRow[] = scored.filter((row) => row.fantraxId !== FIRST);
    expect(pedigreeOf(SIXTH, picks, short)).toMatchObject({ against: 4 });
    expect(pedigreeOf(FIRST, picks, short)).toMatchObject({ against: null });
  });
});
