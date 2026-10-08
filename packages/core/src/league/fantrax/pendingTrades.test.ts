import { describe, expect, it } from "vitest";
import { mapPendingTrades, type RawPendingTrades } from "./pendingTrades";
import recorded from "./__fixtures__/pendingTrades.json";

// Recorded 8 Oct 2026 off the rehearsal league: team 123 offering Notemail two keepers for two, left unanswered.
const RAW = recorded as RawPendingTrades;
const ONE_TWO_THREE = "8enbgqo5msgb375j";
const NOTEMAIL = "v6bxgqm5mtj31znh";

describe("mapPendingTrades", () => {
  it("reads the recorded proposal: its set, its maker, its stamp and both teams", () => {
    const [proposal] = mapPendingTrades(RAW);
    expect(proposal).toMatchObject({
      setId: "ybtx3ctxmuzf4bgu",
      creatorTeamId: ONE_TWO_THREE,
      proposedAt: "Oct 8, 11:53 AM BST",
      teamIds: [ONE_TWO_THREE, NOTEMAIL],
    });
  });

  it("knows which way every man would go", () => {
    const moves = mapPendingTrades(RAW)[0]?.moves ?? [];
    expect(moves.filter((move) => move.toTeamId === NOTEMAIL).map((move) => move.playerName)).toEqual([
      "Lukas Hornícek",
      "Gianluigi Donnarumma",
    ]);
    expect(moves.filter((move) => move.toTeamId === ONE_TWO_THREE).map((move) => move.playerName)).toEqual([
      "Bart Verbruggen",
      "Matz Sels",
    ]);
    expect(moves[0]).toMatchObject({ fantraxId: "0788g", club: "NEW", clubName: "Newcastle United" });
  });

  it("names the session's teams, each of which answers on its own", () => {
    expect(RAW.myTeamIds).toContain(ONE_TWO_THREE);
    expect(RAW.myTeamIds).not.toContain(NOTEMAIL);
  });

  it("drops a trade no longer pending, and an answer with none", () => {
    const settled = { tradeInfoList: (RAW.tradeInfoList ?? []).map((trade) => ({ ...trade, pending: false })) };
    expect(mapPendingTrades(settled)).toEqual([]);
    expect(mapPendingTrades({ noResults: true } as RawPendingTrades)).toEqual([]);
  });
});
