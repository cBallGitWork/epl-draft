import { describe, expect, it } from "vitest";
import blocks from "./__fixtures__/tradeBlocks.json";
import positionRefs from "./__fixtures__/positionRefs.json";
import { mapPositionNames, mapTradeBlocks } from "./tradeBlock";

const POSITIONS = mapPositionNames(positionRefs);

describe("mapPositionNames", () => {
  it("names Fantrax's position ids in its own words", () => {
    expect(POSITIONS.get("703")).toBe("Defender");
    expect(POSITIONS.get("704")).toBe("Goalkeeper");
  });
});

describe("mapTradeBlocks", () => {
  // Recorded 7 Oct 2026: Craig put Haaland on The Raccoons' block in the real league.
  it("reads a recorded block: whose it is, when, and who is offered", () => {
    const [block] = mapTradeBlocks(blocks, POSITIONS);
    expect(block.teamId).toBe("l5kunst8msgbirdf");
    expect(block.updatedAt).toBe("2026-10-07T16:42:36.251Z");
    expect(block.offered).toEqual([
      {
        fantraxId: "061vq",
        playerName: "Erling Haaland",
        position: "F",
        club: "MCI",
        clubName: "Manchester City",
      },
    ]);
    expect(block.wanted).toEqual([]);
    expect(block.comment).toBeNull();
  });

  it("names wanted positions, and leaves out one Fantrax does not name", () => {
    const [block] = mapTradeBlocks(
      { tradeBlocks: [{ teamId: "t1", positionsWanted: { positions: ["703", "999"] }, comment: { body: " Need a CB " } }] },
      POSITIONS,
    );
    expect(block.positionsWanted).toEqual(["Defender"]);
    expect(block.comment).toBe("Need a CB");
    expect(block.updatedAt).toBeNull();
  });

  it("lists a man filed under two positions once", () => {
    const saka = { scorerId: "s1", name: "Bukayo Saka", posShortNames: "M,F" };
    const [block] = mapTradeBlocks(
      { tradeBlocks: [{ teamId: "t1", scorersWanted: { scorers: { "701": [saka], "702": [saka] } } }] },
      POSITIONS,
    );
    expect(block.wanted.map((man) => man.fantraxId)).toEqual(["s1"]);
  });

  it("drops a block that says nothing, and one with no team", () => {
    expect(mapTradeBlocks({ tradeBlocks: [{ teamId: "t1" }, { comment: { body: "hi" } }] }, POSITIONS)).toEqual([]);
    expect(mapTradeBlocks({}, POSITIONS)).toEqual([]);
  });
});
