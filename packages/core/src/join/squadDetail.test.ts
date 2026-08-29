import { describe, expect, it } from "vitest";
import type { Opposition } from "../football/opposition";
import type { Club, FootballPlayer } from "../football/types";
import type { RosteredPlayer } from "./roster";
import type { SquadLine } from "./lineup";
import { lineupDetail, squadDetail } from "./squadDetail";

const arsenal: Club = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" };
const newcastle: Club = { id: 2, code: 4, name: "Newcastle", shortName: "NEW" };

const player = (clubId: number): FootballPlayer => ({
  id: 9, code: 900, name: "Saka", fullName: "Bukayo Saka", clubId,
  status: "a", news: "", chanceOfPlaying: null, optaCode: null,
});

const resolved = (fantraxId: string, clubId: number): RosteredPlayer => ({
  slot: { fantraxId, position: "M", status: "ACTIVE" },
  player: player(clubId),
  stats: [],
});

const unresolved = (fantraxId: string): RosteredPlayer => ({
  slot: { fantraxId, position: "M", status: "ACTIVE" },
  unresolved: "unmapped",
});

const against: Opposition[] = [
  {
    club: newcastle,
    home: false,
    difficulty: 4,
    fixture: {
      id: 1, gameweek: 6, homeClubId: 2, awayClubId: 1, kickoff: null,
      homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
      homeDifficulty: 2, awayDifficulty: 4,
    },
  },
];

const lines: SquadLine[] = [
  { position: "M", players: [resolved("a", 1), unresolved("b"), resolved("c", 99)] },
];

const clubs = new Map([
  [1, arsenal],
  [2, newcastle],
]);
const opposition = new Map([[1, against]]);

describe("squadDetail", () => {
  it("hangs the club and the fixture off the footballer's own club", () => {
    const [line] = squadDetail(lines, clubs, opposition, null);
    expect(line?.players[0]?.club).toBe(arsenal);
    expect(line?.players[0]?.opposition).toBe(against);
  });

  it("leaves both undefined for a slot with no footballer behind it", () => {
    const [line] = squadDetail(lines, clubs, opposition, null);
    expect(line?.players[1]?.club).toBeUndefined();
    expect(line?.players[1]?.opposition).toBeUndefined();
  });

  it("leaves the fixture undefined for a club with no match this round", () => {
    // Club 99 is not in either map: he is a real footballer whose club this
    // snapshot does not list, which is a blank rather than a bug.
    const [line] = squadDetail(lines, clubs, opposition, null);
    expect(line?.players[2]?.opposition).toBeUndefined();
  });

  it("tells no table apart from a table that does not name him", () => {
    const noTable = squadDetail(lines, clubs, opposition, null);
    expect(noTable[0]?.players[0]?.points).toBeUndefined();

    // He is missing from a table that answered. That is a dash, not a missing
    // column — otherwise one row in fifteen loses its last cell.
    const table = squadDetail(lines, clubs, opposition, new Map([["c", 42]]));
    expect(table[0]?.players[0]?.points).toBeNull();
    expect(table[0]?.players[2]?.points).toBe(42);
  });

  it("keeps a nought, which is a score, out of the null that is not one", () => {
    const table = squadDetail(lines, clubs, opposition, new Map([["a", 0]]));
    expect(table[0]?.players[0]?.points).toBe(0);
  });

  it("keeps the lines and their order exactly as the arrangement left them", () => {
    const detailed = squadDetail(lines, clubs, opposition, null);
    expect(detailed.map((line) => line.position)).toEqual(["M"]);
    expect(detailed[0]?.players.map((p) => p.rostered.slot.fantraxId)).toEqual(["a", "b", "c"]);
  });
});

describe("squadDetail, on the arrangement", () => {
  it("hands out no player's ACTIVE or RESERVE", () => {
    // The board is a client component, so everything here is serialised into the
    // page and readable from View Source. Before this, a rival's squad shipped
    // eleven ACTIVE and four RESERVE while the screen withheld the lineup —
    // which is the whole of what `visibility.ts` exists to prevent.
    const lines = squadDetail(
      [{ position: "M", players: [slot("a1", "ACTIVE"), slot("a2", "RESERVE")] }],
      new Map(),
      new Map(),
      null,
    );
    const statuses = lines.flatMap((line) => line.players.map((p) => p.rostered.slot.status));
    expect(statuses).toEqual(["", ""]);
    expect(JSON.stringify(lines)).not.toContain("ACTIVE");
    expect(JSON.stringify(lines)).not.toContain("RESERVE");
  });

  it("keeps everything a view actually reads", () => {
    const [line] = squadDetail(
      [{ position: "M", players: [slot("a1", "ACTIVE")] }],
      new Map(),
      new Map(),
      null,
    );
    expect(line?.players[0]?.rostered.slot.fantraxId).toBe("a1");
    expect(line?.players[0]?.rostered.slot.position).toBe("M");
  });
});

function slot(fantraxId: string, status: string) {
  return { slot: { fantraxId, position: "M", status }, unresolved: "unmapped" as const };
}

describe("lineupDetail", () => {
  const team = {
    teamId: "t1",
    teamName: "Test",
    players: [resolved("a", 1), { ...resolved("b", 1), slot: { fantraxId: "b", position: "M", status: "RESERVE" } }],
  };

  it("splits the XI from the bench before the split is blanked", () => {
    // `playerDetail` blanks `slot.status` on the way out, so the arrangement can
    // only be read here. A view handed these lines cannot rebuild it, which is
    // the point.
    const { rows, bench } = lineupDetail(team, clubs, opposition, null);
    expect(rows.flatMap((row) => row.players.map((p) => p.rostered.slot.fantraxId))).toEqual(["a"]);
    expect(bench.map((p) => p.rostered.slot.fantraxId)).toEqual(["b"]);
    expect(JSON.stringify({ rows, bench })).not.toContain("RESERVE");
  });

  it("hangs the same detail off a reserve as off a starter", () => {
    const { bench } = lineupDetail(team, clubs, opposition, new Map([["b", 7]]));
    expect(bench[0]?.club).toBe(arsenal);
    expect(bench[0]?.opposition).toBe(against);
    expect(bench[0]?.points).toBe(7);
  });
});
