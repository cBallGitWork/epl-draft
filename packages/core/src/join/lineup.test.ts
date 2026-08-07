import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "../football/types";
import type { RosteredPlayer, RosteredTeam } from "./roster";
import { lineup } from "./lineup";

const player = (name: string): FootballPlayer => ({
  id: 1, code: 1, name, fullName: name, clubId: 1,
  squadNumber: null, status: "a", news: "", chanceOfPlaying: null, optaCode: null,
});

const slot = (position: string | null, status: string, name = "X"): RosteredPlayer => ({
  slot: { fantraxId: name, position, status },
  player: player(name),
  stats: [],
});

const team = (players: RosteredPlayer[]): RosteredTeam => ({
  teamId: "t1",
  teamName: "CB_fantr",
  players,
});

/** The rehearsal league's real drafted XI: one keeper, three at the back, four
 *  in midfield, three up front, four on the bench. */
const drafted = team([
  slot("F", "RESERVE", "Maeda"),
  slot("M", "ACTIVE", "Palmer"),
  slot("M", "RESERVE", "Doku"),
  slot("G", "ACTIVE", "Martinez"),
  slot("F", "ACTIVE", "Haaland"),
  slot("M", "ACTIVE", "Bruno G."),
  slot("M", "RESERVE", "Rudoni"),
  slot("F", "ACTIVE", "João Pedro"),
  slot("D", "ACTIVE", "Cash"),
  slot("D", "ACTIVE", "Truffert"),
  slot("D", "ACTIVE", "Mukiele"),
  slot("M", "ACTIVE", "Wilson"),
  slot("F", "ACTIVE", "Isak"),
  slot("M", "ACTIVE", "Enzo"),
  slot("M", "RESERVE", "Manzambi"),
]);

describe("lineup", () => {
  it("orders the lines back to front, whatever order Fantrax listed them in", () => {
    // The fixture above is in Fantrax's own order, which is neither positional
    // nor alphabetical — it is draft order.
    expect(lineup(drafted).lines.map((line) => line.position)).toEqual(["G", "D", "M", "F"]);
  });

  it("counts the formation rather than reading one, because Fantrax has no such field", () => {
    expect(lineup(drafted).shape).toBe("1-3-4-3");
  });

  it("keeps the eleven on the pitch and the rest on the bench", () => {
    const { lines, bench } = lineup(drafted);
    expect(lines.flatMap((line) => line.players)).toHaveLength(11);
    expect(bench).toHaveLength(4);
  });

  it("puts the bench in the same order as the pitch", () => {
    expect(lineup(drafted).bench.map((p) => p.slot.fantraxId)).toEqual([
      "Doku", "Rudoni", "Manzambi", "Maeda",
    ]);
  });

  it("survives a shape nobody would pick", () => {
    // A commissioner can set any caps, and a manager who has not set a lineup can
    // leave one on. Five at the back with no forwards is legal in our league.
    const odd = team([
      slot("G", "ACTIVE", "G1"),
      ...["D1", "D2", "D3", "D4", "D5"].map((n) => slot("D", "ACTIVE", n)),
    ]);
    expect(lineup(odd).shape).toBe("1-5");
  });

  it("shows a letter it has never seen in front of every one it knows", () => {
    // Position is commissioner-mutable league state, so a new letter is a real
    // possibility. It goes to the front, where it looks wrong on purpose.
    //
    // The unknown letter is listed FIRST and a third line sits between the two
    // known ones: with the unknown slot last, or with only two lines, a sort
    // that filed it in goal would still produce the expected order out of
    // insertion order alone, and the test would pass on the bug it is named for.
    const withWinger = team([
      slot("W", "ACTIVE", "W1"),
      slot("G", "ACTIVE", "G1"),
      slot("D", "ACTIVE", "D1"),
    ]);
    expect(lineup(withWinger).lines.map((line) => line.position)).toEqual(["G", "D", "W"]);
  });

  it("places a slot Fantrax gave no position rather than dropping the player", () => {
    const nameless = team([
      slot(null, "ACTIVE", "?"),
      slot("G", "ACTIVE", "G1"),
      slot("D", "ACTIVE", "D1"),
    ]);
    const { lines } = lineup(nameless);
    expect(lines.flatMap((line) => line.players)).toHaveLength(3);
    expect(lines.map((line) => line.position)).toEqual(["G", "D", ""]);
  });

  it("degrades to an empty pitch rather than throwing", () => {
    // What every team returns before the draft.
    expect(lineup(team([]))).toEqual({ lines: [], bench: [], shape: "" });
  });
});
