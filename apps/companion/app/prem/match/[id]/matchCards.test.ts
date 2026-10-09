import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "@epl/core";
import type { Match } from "./match";
import { squadsOf } from "./matchCards";

const man = (code: number, clubId: number, status: string): FootballPlayer =>
  ({ code, clubId, status, news: "", chanceOfPlaying: null }) as unknown as FootballPlayer;

describe("squadsOf", () => {
  it("lists each club's books before a team sheet, never a man who has left it", () => {
    // FPL's `u` is a man gone: loaned or sold, still filed at his old club.
    const match = {
      home: { id: 1 },
      away: { id: 2 },
      snapshot: { players: [man(10, 1, "a"), man(11, 1, "u"), man(12, 1, "i"), man(20, 2, "a")] },
    } as unknown as Match;
    expect(squadsOf(match)).toEqual({ home: [10, 12], away: [20] });
  });
});
