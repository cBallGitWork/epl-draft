import { describe, expect, it } from "vitest";
import { mapTeamRosters } from "./rosters";
import type { RawTeamRosters } from "./raw";
import teamRosters from "./__fixtures__/teamRosters.json";

// Trimmed from the rehearsal league's first populated response (6 Aug 2026): two
// of its four teams, four of each team's fifteen slots, both statuses and several
// positions. One slot has had its `id` removed, which is a state Fantrax has
// actually produced.

const raw = teamRosters as RawTeamRosters;

describe("mapTeamRosters", () => {
  const rosters = mapTeamRosters(raw);

  it("carries the period Fantrax echoed back", () => {
    expect(rosters.period).toBe(1);
  });

  it("keys each roster by the team id, with its name beside it", () => {
    const team = rosters.teams.find((t) => t.teamId === "8enbgqo5msgb375j");
    expect(team?.teamName).toBe("123");
    expect(rosters.teams).toHaveLength(2);
  });

  it("keeps active and reserve apart", () => {
    const team = rosters.teams.find((t) => t.teamId === "8enbgqo5msgb375j");
    const active = team?.slots.filter((slot) => slot.status === "ACTIVE") ?? [];
    const reserve = team?.slots.filter((slot) => slot.status === "RESERVE") ?? [];
    expect(active).toHaveLength(2);
    expect(reserve).toHaveLength(2);
    expect(active.map((slot) => slot.fantraxId)).toContain("05l8q");
  });

  it("skips a slot that names no player rather than inventing an id", () => {
    // The fixture's last test4 slot has no `id`. An empty-string fantraxId would
    // survive this mapper and fail later, in a bridge lookup, far from the cause.
    const team = rosters.teams.find((t) => t.teamId === "sezrgvl2mshcpazf");
    expect(team?.slots).toHaveLength(3);
    expect(team?.slots.every((slot) => slot.fantraxId.length > 0)).toBe(true);
  });

  it("keeps Fantrax's position letter as-is", () => {
    const keeper = rosters.teams
      .flatMap((team) => team.slots)
      .find((slot) => slot.fantraxId === "02lz0");
    expect(keeper?.position).toBe("G");
  });

  it("degrades to an empty period rather than throwing", () => {
    // What the real league returns today, and what every view must survive.
    const empty = mapTeamRosters({});
    expect(empty.period).toBeNull();
    expect(empty.teams).toEqual([]);
  });
});
