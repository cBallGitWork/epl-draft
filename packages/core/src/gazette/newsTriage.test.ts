import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import { affectedBy } from "./newsTriage";
import type { RosteredTeam } from "../join/roster";
import type { NewsItem } from "../news/map";

const item = (title: string, summary = ""): NewsItem => ({
  key: "k",
  title,
  summary,
  link: "l",
  publishedAt: null,
});

const man = (name: string) => ({
  slot: { fantraxId: name, position: "M", status: "ACTIVE" },
  player: {
    id: 1, code: 1, name, fullName: name, clubId: 1,
    status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON,
  },
  stats: [],
});

const teams: RosteredTeam[] = [
  { teamId: "t1", teamName: "test2", players: [man("Muñoz"), man("Son")] },
  { teamId: "t2", teamName: "test3", players: [man("Fernandes")] },
];

describe("affectedBy", () => {
  it("finds the men the league holds, with their owners", () => {
    const found = affectedBy(item("Forest complete £22m Munoz signing from Palace"), teams);
    // Ours is spelled with the tilde and the wire's is not; matching is on the
    // surname as written, so this is the honest miss rather than a fuzzy hit.
    expect(found).toEqual([]);

    const hit = affectedBy(item("Fernandes masterclass against Ipswich"), teams);
    expect(hit).toEqual([{ playerName: "Fernandes", ownerName: "test3" }]);
  });

  it("does not match inside another word", () => {
    // The reason the floor exists: "Son" would hit "season" on nearly every
    // item in the feed.
    expect(affectedBy(item("A long season ahead for Spurs"), teams)).toEqual([]);
  });

  it("answers empty for the ordinary item, which is about nobody we hold", () => {
    expect(affectedBy(item("Coventry sign a goalkeeper"), teams)).toEqual([]);
  });

  it("finds a surname that opens or closes on an accented letter", () => {
    // A plain \b counts only ASCII as a word, so "Ødegaard" and "Sangaré" never matched as written.
    const accented: RosteredTeam[] = [{ teamId: "t3", teamName: "test4", players: [man("Ødegaard"), man("Sangaré")] }];
    expect(affectedBy(item("Ødegaard out for a month", "Sangaré is back in training"), accented)).toEqual([
      { playerName: "Ødegaard", ownerName: "test4" },
      { playerName: "Sangaré", ownerName: "test4" },
    ]);
  });

  it("reads the summary as well as the headline", () => {
    expect(affectedBy(item("Injury latest", "Fernandes is a doubt"), teams)).toHaveLength(1);
  });
});
