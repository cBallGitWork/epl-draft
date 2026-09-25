import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import type { FootballPlayer } from "../football/types";
import type { RosteredTeam } from "../join/roster";
import { availability } from "./availability";

const footballer = (over: Partial<FootballPlayer>): FootballPlayer => ({
  id: 1, code: 1, name: "Player", fullName: "Player", clubId: 1, status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON, ...over,
});

const squad = (players: FootballPlayer[]): RosteredTeam => ({
  teamId: "t1",
  teamName: "Team",
  players: players.map((player, i) => ({
    slot: { fantraxId: `f${i}`, position: "M", status: "ACTIVE" },
    player,
    stats: [],
  })),
});

describe("availability", () => {
  it("reports the doubts and leaves the fit alone", () => {
    const notes = availability([
      squad([
        footballer({ name: "Fit" }),
        footballer({ name: "Injured", status: "i", news: "Knee injury", chanceOfPlaying: 0 }),
      ]),
    ]);
    expect(notes.map((n) => n.playerName)).toEqual(["Injured"]);
  });

  it("leaves out a player FPL has cleared", () => {
    // 100% with nothing to say is FPL saying he is fine, which is not news.
    expect(availability([squad([footballer({ chanceOfPlaying: 100 })])])).toEqual([]);
  });

  it("prints the least likely to play first", () => {
    const notes = availability([
      squad([
        footballer({ name: "Doubtful", status: "d", chanceOfPlaying: 50, news: "Knock" }),
        footballer({ name: "Out", status: "i", chanceOfPlaying: 0, news: "Hamstring" }),
      ]),
    ]);
    expect(notes.map((n) => n.playerName)).toEqual(["Out", "Doubtful"]);
  });

  it("sorts an unknown chance between a stated zero and a stated hundred", () => {
    // "No comment" is less urgent than "will not play" and more urgent than
    // "fine" — modelling it as either would misinform a manager picking a side.
    const notes = availability([
      squad([
        footballer({ name: "Unknown", status: "d", news: "Late fitness test" }),
        footballer({ name: "Out", status: "i", chanceOfPlaying: 0, news: "Hamstring" }),
        footballer({ name: "Likely", status: "d", chanceOfPlaying: 90, news: "Knock" }),
      ]),
    ]);
    expect(notes.map((n) => n.playerName)).toEqual(["Out", "Unknown", "Likely"]);
  });

  it("says nothing about a squad we could not resolve", () => {
    const unresolved: RosteredTeam = {
      teamId: "t1",
      teamName: "Team",
      players: [{ slot: { fantraxId: "x", position: "M", status: "ACTIVE" }, unresolved: "unmapped" }],
    };
    expect(availability([unresolved])).toEqual([]);
  });
});
