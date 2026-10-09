import { describe, expect, it } from "vitest";
import type { PlSquadMan, PlTeamSheet } from "../../football/premierleague/teamSheet";
import { PALMER, SAKA, matchInput, moment } from "./__fixtures__/built";
import { manLine } from "./briefLines";
import { keyStats } from "./keyStats";
import { lineupOf } from "./lineups";
import { reportMen } from "./men";
import { manCounts, matchEvents } from "./timeline";

const squad = (code: number, name: string): PlSquadMan => ({ code, name, shirt: null, position: "M", captain: false });
const sheet = (lineup: PlSquadMan[], substitutes: PlSquadMan[] = []): PlTeamSheet => ({ teamId: 1, lineup, substitutes, formation: null, shape: null });
const noExtras = { live: new Map(), season: null, holders: new Map(), points: new Map(), fitness: new Map() };

describe("a man sent off", () => {
  const moments = [moment("55", "sent-off", [1, null])];
  const men = reportMen({ home: sheet([squad(1, "William Saliba")]), away: sheet([squad(3, "Cole Palmer")]) }, moments, noExtras);
  const events = matchEvents(matchInput(men, moments, [0, 0]));

  it("is told as sent off, never as taken off", () => {
    expect(men[0]).toMatchObject({ offAt: "55", sentOff: true, injuredOff: false });
    expect(manLine(men[0], manCounts(events, men).get(1), events)).toBe("started; was sent off");
  });
});

describe("lineupOf with a substitute replaced in turn", () => {
  const moments = [moment("60", "substitution", [2, 1]), moment("80", "substitution", [6, 2], { injury: true })];
  const lineup = lineupOf(sheet([squad(1, "Bukayo Saka")], [squad(2, "Noni Madueke"), squad(6, "Ethan Nwaneri"), squad(7, "Myles Lewis-Skelly")]), moments);

  it("keeps the man who came on for the substitute, under him", () => {
    expect(lineup.lines[0][0].replacedBy).toEqual({ name: "Madueke", minute: "60", booked: false, replacedBy: { name: "Nwaneri", minute: "80", booked: false } });
    expect(lineup.unused).toEqual(["Lewis-Skelly"]);
  });
});

describe("keyStats' woodwork", () => {
  it("names a man who hit it twice once", () => {
    const match = matchInput([SAKA, PALMER], [moment("10", "woodwork", [1, null]), moment("50", "woodwork", [1, null])], [0, 0]);
    const events = matchEvents(match);
    expect(keyStats(match, events, manCounts(events, match.men), 9).find((k) => k.label === "Hit the woodwork")?.value).toBe("Saka");
  });
});
