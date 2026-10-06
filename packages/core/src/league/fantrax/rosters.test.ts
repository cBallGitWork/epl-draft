import { describe, expect, it } from "vitest";
import { mapTeamRosters } from "./rosters";
import type { RawTeamRosters } from "./raw";
import teamRosters from "./__fixtures__/teamRosters.json";

// Trimmed from a real rehearsal response: two teams, four slots each, both statuses, several positions.
// One slot has no `id`, a state Fantrax has produced.

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
    // The last test4 slot has no `id`; an empty-string fantraxId would fail later, in a bridge lookup.
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
    // What an undrafted league returns, and what every view must survive.
    const empty = mapTeamRosters({});
    expect(empty.period).toBeNull();
    expect(empty.teams).toEqual([]);
  });
});
