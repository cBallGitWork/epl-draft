import { describe, expect, it } from "vitest";
import { mapEntry, mapSquad } from "./map";

describe("mapEntry", () => {
  it("reads a manager's side", () => {
    const entry = mapEntry({
      id: 1,
      name: "Solio Moose",
      player_first_name: "Chris",
      player_last_name: "Musson",
      summary_overall_points: 210,
      summary_overall_rank: 4021,
      summary_event_points: 63,
      current_event: 3,
      leagues: { classic: [{ id: 14, name: "Liverpool", entry_rank: 12, league_type: "s" }] },
    });
    expect(entry.managerName).toBe("Chris Musson");
    expect(entry.teamName).toBe("Solio Moose");
    expect(entry.overallPoints).toBe(210);
    expect(entry.leagues[0].name).toBe("Liverpool");
  });

  it("keeps a pre-season entry's nulls as nulls", () => {
    // FPL sends null before a ball is kicked. "Has not played" and "scored
    // nothing" are different answers and a manager can tell them apart.
    const entry = mapEntry({ id: 1, summary_overall_points: null, current_event: null });
    expect(entry.overallPoints).toBeNull();
    expect(entry.overallRank).toBeNull();
    expect(entry.currentEvent).toBeNull();
  });

  it("reads a rank of zero as no rank", () => {
    // FPL's placeholder for an unranked entry. Nought is not a position.
    const entry = mapEntry({ leagues: { classic: [{ id: 9, entry_rank: 0, entry_last_rank: 0 }] } });
    expect(entry.leagues[0].rank).toBeNull();
    expect(entry.leagues[0].lastRank).toBeNull();
  });

  it("survives an entry stripped of everything", () => {
    expect(mapEntry({}).leagues).toEqual([]);
    expect(mapEntry({}).managerName).toBe("");
  });
});

const code = (element: number) => (element === 404 ? null : 1000 + element);
const points = (element: number) => (element === 1 ? 12 : 2);

describe("mapSquad", () => {
  it("carries FPL's slot order, which is what tells a starter from a substitute", () => {
    // Their `position` is 1–15 and is an ordering, not a football position. The
    // XI/bench split rests entirely on it, so a payload that stopped sending it
    // must not silently produce a fifteen-man starting side.
    const squad = mapSquad(
      {
        picks: [
          { element: 1, position: 1, multiplier: 1 },
          { element: 2, position: 11, multiplier: 1 },
          { element: 3, position: 12, multiplier: 0 },
          { element: 4, multiplier: 0 },
        ],
        entry_history: { event: 3, points: 63 },
      },
      code,
      points,
    );
    expect(squad?.picks.map((pick) => pick.slot)).toEqual([1, 11, 12, 0]);
  });

  it("multiplies the captain and benches the bench", () => {
    const squad = mapSquad(
      {
        picks: [
          { element: 1, multiplier: 2, is_captain: true },
          { element: 2, multiplier: 1 },
          { element: 3, multiplier: 0 },
        ],
        entry_history: { event: 3, points: 63, event_transfers_cost: 4 },
      },
      code,
      points,
    );
    expect(squad?.picks.map((p) => p.points)).toEqual([24, 2, 0]);
    expect(squad?.picks[0].isCaptain).toBe(true);
  });

  it("shows FPL's total rather than adding the picks up", () => {
    // Autosubs and transfer hits both move it, and our sum would disagree with
    // the app the manager is looking at.
    const squad = mapSquad(
      { picks: [{ element: 1, multiplier: 1 }], entry_history: { event: 3, points: 63, event_transfers_cost: 4 } },
      code,
      points,
    );
    expect(squad?.total).toBe(63);
    expect(squad?.hit).toBe(4);
  });

  it("drops a pick it cannot name rather than rendering a blank", () => {
    const squad = mapSquad(
      { picks: [{ element: 404, multiplier: 1 }, { element: 2, multiplier: 1 }], entry_history: { event: 3 } },
      code,
      points,
    );
    expect(squad?.picks).toHaveLength(1);
  });

  it("says nothing when FPL names no gameweek", () => {
    expect(mapSquad({ picks: [] }, code, points)).toBeNull();
  });
});
