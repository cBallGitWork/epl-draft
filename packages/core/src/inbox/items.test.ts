import { describe, expect, it } from "vitest";
import type { AvailabilityNote, Deal } from "../gazette/types";
import { availabilityNews, dealNews, inboxItems, roundNews } from "./items";

const NAMES: Record<string, string> = { t1: "Craig's XI", t2: "Dave's XI" };
const name = (id: string) => NAMES[id] ?? null;

const claim: Deal = {
  setId: "s1",
  kind: "claim",
  inbound: [{ playerName: "Alexander Isak", teamId: "t1", club: "LIV" }],
  outbound: [{ playerName: "Cody Gakpo", teamId: "t1", club: "LIV" }],
  processedAt: "Fri Sep 4, 7:45pm",
  period: 3,
};

const trade: Deal = {
  setId: "s2",
  kind: "trade",
  inbound: [{ playerName: "Declan Rice", teamId: "t1" }],
  outbound: [{ playerName: "Kai Havertz", teamId: "t2" }],
  processedAt: "Thu Sep 3, 1:00pm",
  period: 3,
};

describe("dealNews", () => {
  it("names the manager and what he signed", () => {
    const [item] = dealNews([claim], name);
    expect(item.headline).toBe("Craig's XI sign Alexander Isak (LIV)");
    expect(item.body).toBe("In: Alexander Isak (LIV). Out: Cody Gakpo (LIV).");
    expect(item.teamId).toBe("t1");
    expect(item.category).toBe("message");
  });

  it("makes a trade ONE item, belonging to neither side", () => {
    // Fantrax files both halves as separate rows sharing a `setId`. Reading them
    // apart is how you get a feed that says a manager signed a player and,
    // separately and mysteriously, lost one.
    const items = dealNews([trade], name);
    expect(items).toHaveLength(1);
    expect(items[0].headline).toBe("Craig's XI and Dave's XI agree a trade");
    expect(items[0].teamId).toBeNull();
  });

  it("never marks business urgent", () => {
    // A manager who made a deal already knows he made it, and a rival's is not
    // bad news. CM's red ground is for something else.
    expect(dealNews([claim, trade], name).every((item) => !item.urgent)).toBe(true);
  });

  it("keeps a manager the league no longer names, rather than dropping his deal", () => {
    const orphan: Deal = { ...claim, setId: "s3", inbound: [{ playerName: "X", teamId: "gone" }], outbound: [] };
    const [item] = dealNews([orphan], name);
    expect(item.headline).toBe("A manager sign X");
  });

  it("drops a deal with nobody on either side", () => {
    expect(dealNews([{ ...claim, setId: "s4", inbound: [], outbound: [] }], name)).toEqual([]);
  });
});

describe("availabilityNews", () => {
  const note = (over: Partial<AvailabilityNote> = {}): AvailabilityNote => ({
    playerName: "Alexander Isak",
    teamId: "t1",
    news: "Knock - 75% chance of playing.",
    chance: 75,
    ...over,
  });

  it("prints FPL's own words and says who holds him", () => {
    const [item] = availabilityNews([note()], name, 3, "t2");
    expect(item.headline).toBe("Alexander Isak is 75% to play");
    expect(item.body).toBe("Knock - 75% chance of playing. Craig's XI holds him.");
    expect(item.category).toBe("injury");
  });

  it("carries the round rather than a date it invented", () => {
    // FPL publishes no "as of" for a doubt: it is a state that holds now, and
    // dating it to the moment we read it would be a fact we made up.
    const [item] = availabilityNews([note()], name, 3, null);
    expect(item.at).toBeNull();
    expect(item.gameweek).toBe(3);
  });

  it("goes red only for the reader's own man, and only when he is a real doubt", () => {
    const yours = (chance: number | null) =>
      availabilityNews([note({ chance })], name, 3, "t1")[0].urgent;
    expect(yours(0)).toBe(true);
    expect(yours(25)).toBe(true);
    expect(yours(75)).toBe(false);
    // No opinion from FPL is not a doubt. Null is not zero — "no comment" and
    // "will not play" are different things to a manager picking a side.
    expect(yours(null)).toBe(false);
    // A rival's man is news and never bad news.
    expect(availabilityNews([note({ chance: 0 })], name, 3, "t2")[0].urgent).toBe(false);
  });

  it("puts a full stop on FPL's note when it has none", () => {
    // Their wording is inconsistent about it, and this body always puts a second
    // sentence after theirs — so without the stop the screen prints
    // "…rest of the season Craig's XI holds him."
    const [item] = availabilityNews(
      [note({ news: "Has joined Birmingham on loan for the rest of the season" })],
      name,
      3,
      null,
    );
    expect(item.body).toBe(
      "Has joined Birmingham on loan for the rest of the season. Craig's XI holds him.",
    );
    // And never a second one where they already ended the sentence.
    expect(availabilityNews([note()], name, 3, null)[0].body).toBe(
      "Knock - 75% chance of playing. Craig's XI holds him.",
    );
  });

  it("keeps a man nobody holds", () => {
    const [item] = availabilityNews([note({ teamId: null })], name, 3, "t1");
    expect(item.body).toContain("Nobody in the league holds him.");
    expect(item.urgent).toBe(false);
  });
});

describe("roundNews", () => {
  it("files the deadline and the reader's own result", () => {
    const items = roundNews({
      gameweek: 3,
      deadline: "2026-09-04T18:45:00Z",
      yours: { opponent: "Dave's XI", points: 61.4, against: 58.9 },
    });
    expect(items.map((item) => item.headline)).toEqual([
      "Gameweek 3 lineups lock",
      "Gameweek 3: won against Dave's XI",
    ]);
  });

  it("goes red for a defeat and not for a win or a draw", () => {
    const result = (points: number, against: number) =>
      roundNews({ gameweek: 3, deadline: null, yours: { opponent: "D", points, against } })[0];
    expect(result(1, 2).urgent).toBe(true);
    expect(result(2, 1).urgent).toBe(false);
    expect(result(2, 2).urgent).toBe(false);
    expect(result(2, 2).headline).toBe("Gameweek 3: drawn against D");
  });

  it("files nothing for a tie with no score", () => {
    // A round nobody has played is not a nil-nil. `points` is null exactly when
    // Fantrax gave no total (DESIGN §7).
    expect(
      roundNews({ gameweek: 3, deadline: null, yours: { opponent: "D", points: null, against: 0 } }),
    ).toEqual([]);
  });
});

describe("inboxItems", () => {
  it("puts dated items first, newest first, and undated ones after", () => {
    const items = inboxItems(
      availabilityNews([{ playerName: "P", teamId: "t1", news: "n", chance: 0 }], name, 3, null),
      roundNews({ gameweek: 3, deadline: "2026-09-04T18:45:00Z", yours: null }),
      dealNews([{ ...claim, processedAt: "2026-09-05T09:00:00Z" }], name),
    );
    expect(items.map((item) => item.id)).toEqual([
      "deal:s1",
      "deadline:3",
      "doubt:P",
    ]);
  });

  it("keeps each builder's own order among the undated", () => {
    // The paper sorts availability with the reader's own men first, and that is
    // a reading aid this must not undo.
    const notes: AvailabilityNote[] = [
      { playerName: "Mine", teamId: "t1", news: "", chance: 0 },
      { playerName: "Theirs", teamId: "t2", news: "", chance: 0 },
    ];
    expect(inboxItems(availabilityNews(notes, name, 3, "t1")).map((i) => i.id)).toEqual([
      "doubt:Mine",
      "doubt:Theirs",
    ]);
  });
});
