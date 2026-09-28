import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { highlightFor, parseHighlightFeed, parseHighlightTitle } from "./highlights";

// Titles taken verbatim from Sky's `Premier League Highlights 26/27` playlist on
// 11 Sep 2026, including the one in fifteen that does not put the fixture
// between two pipes — a sample of one would have missed it.
const TITLES = [
  "Arsenal stage comeback in fiery London derby | Arsenal 2-1 Chelsea | Premier League Highlights",
  "Forest have goal RULED OUT as Spurs get first point | N Forest 0-0 Spurs | Premier League Highlights",
  "Blues' front three shine again in home win! Chelsea 4-3 Brighton | Premier League Highlights",
  "Hull yet to concede on Premier League return! | Hull 0-0 Aston Villa | Premier League Highlights",
];

describe("parseHighlightTitle", () => {
  it("reads the fixture out of the ordinary shape", () => {
    expect(parseHighlightTitle(TITLES[0])).toEqual({
      home: "Arsenal",
      away: "Chelsea",
      homeScore: 2,
      awayScore: 1,
    });
  });

  it("reads the one that is not between two pipes", () => {
    expect(parseHighlightTitle(TITLES[2])).toEqual({
      home: "Chelsea",
      away: "Brighton",
      homeScore: 4,
      awayScore: 3,
    });
  });

  it("turns Sky's spelling into FPL's name", () => {
    expect(parseHighlightTitle(TITLES[1])?.home).toBe("Nott'm Forest");
    expect(parseHighlightTitle(TITLES[3])?.home).toBe("Hull City");
  });

  it("reads Sky's short and long forms FPL spells differently", () => {
    // Both from gameweek 5's titles; neither video ever joined its fixture.
    expect(parseHighlightTitle("Isak winner! | B'mouth 0-1 Liverpool | Premier League Highlights")?.home).toBe("Bournemouth");
    expect(parseHighlightTitle("Coventry end wait! | Nottingham Forest 0-1 Coventry | Premier League Highlights")?.home).toBe("Nott'm Forest");
  });

  it("leaves a club the two already agree on alone", () => {
    expect(parseHighlightTitle(TITLES[1])?.away).toBe("Spurs");
  });

  it("carries a goalless draw rather than treating 0 as absent", () => {
    const said = parseHighlightTitle("X | N Forest 0-0 Spurs | Y");
    expect(said?.homeScore).toBe(0);
    expect(said?.awayScore).toBe(0);
  });

  it("is null for a title carrying no fixture", () => {
    expect(parseHighlightTitle("How do tennis commentators prepare for the US Open?")).toBeNull();
  });
});

describe("parseHighlightFeed", () => {
  const xml = `<feed>${TITLES.map(
    (t, n) => `<entry><yt:videoId>id${n}</yt:videoId><media:title>${t}</media:title></entry>`,
  ).join("")}<entry><yt:videoId>junk</yt:videoId><media:title>Inside the Huddle</media:title></entry></feed>`;

  it("reads every entry whose title carries a fixture", () => {
    expect(parseHighlightFeed(xml).map((v) => v.id)).toEqual(["id0", "id1", "id2", "id3"]);
  });

  it("drops an entry it cannot place rather than keeping it with nulls", () => {
    // A video we cannot place is a video we will never show.
    expect(parseHighlightFeed(xml).some((v) => v.id === "junk")).toBe(false);
  });

  it("has nothing to say about an empty feed", () => {
    expect(parseHighlightFeed("<feed></feed>")).toEqual([]);
  });
});

describe("highlightFor", () => {
  const videos = parseHighlightFeed(
    TITLES.map((t, n) => `<entry><yt:videoId>id${n}</yt:videoId><media:title>${t}</media:title></entry>`).join(""),
  );

  it("finds the video whose clubs AND score match", () => {
    expect(
      highlightFor(videos, { home: "Arsenal", away: "Chelsea", homeScore: 2, awayScore: 1 })?.id,
    ).toBe("id0");
  });

  it("refuses the same pairing at a different scoreline", () => {
    // Two clubs meet twice a season; the score is the discriminator.
    expect(
      highlightFor(videos, { home: "Arsenal", away: "Chelsea", homeScore: 1, awayScore: 1 }),
    ).toBeNull();
  });

  it("refuses the reverse fixture", () => {
    expect(
      highlightFor(videos, { home: "Chelsea", away: "Arsenal", homeScore: 2, awayScore: 1 }),
    ).toBeNull();
  });

  it("matches a club through its alias, which is the point of normalising", () => {
    expect(
      highlightFor(videos, { home: "Hull City", away: "Aston Villa", homeScore: 0, awayScore: 0 })?.id,
    ).toBe("id3");
  });

  it("shows nothing for a match with no score yet", () => {
    expect(
      highlightFor(videos, { home: "Arsenal", away: "Chelsea", homeScore: null, awayScore: null }),
    ).toBeNull();
  });

  it("shows nothing when the playlist has not reached this fixture", () => {
    expect(
      highlightFor(videos, { home: "Everton", away: "Man Utd", homeScore: 2, awayScore: 2 }),
    ).toBeNull();
  });
});

describe("the playlist as recorded on 28 Sep 2026", () => {
  // FPL's `name` for the 26/27 clubs, from bootstrap-static the same morning.
  const FPL_NAMES = new Set([
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton", "Chelsea", "Coventry City", "Crystal Palace",
    "Everton", "Fulham", "Hull City", "Ipswich Town", "Leeds", "Liverpool", "Man City", "Man Utd", "Newcastle",
    "Nott'm Forest", "Spurs", "Sunderland",
  ]);
  const videos = parseHighlightFeed(readFileSync(new URL("./__fixtures__/skyHighlights.xml", import.meta.url), "utf8"));

  it("places every entry, and every club in it is a club FPL names", () => {
    expect(videos).toHaveLength(15);
    expect(videos.flatMap((v) => [v.home, v.away]).filter((club) => !FPL_NAMES.has(club))).toEqual([]);
  });
});
