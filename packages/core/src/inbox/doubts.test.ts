import { describe, expect, it } from "vitest";
import type { AvailabilityNote } from "../gazette/types";
import { availabilityNews } from "./doubts";

describe("availabilityNews", () => {
  const note = (over: Partial<AvailabilityNote> = {}): AvailabilityNote => ({
    playerName: "Isak",
    fullName: "Alexander Isak",
    newsAt: "2026-09-15T19:30:09Z",
    teamId: "t1",
    state: "doubt",
    label: "Dbt",
    out: false,
    news: "Knock - 75% chance of playing.",
    chance: 75,
    ...over,
  });

  /** A man who is definitely not playing, which is a different fact from a low
   *  chance — `availabilityOf` sets `out` for a status of `i`, `s` or `u`, and a
   *  ban carries no chance at all. */
  const banned = (over: Partial<AvailabilityNote> = {}) =>
    note({ state: "suspended", label: "Sus", out: true, chance: null, news: "Suspended.", ...over });

  /** FPL's `i`, spread under a note's own news. */
  const injured = { state: "injured", label: "Inj", out: true, chance: 0 } as const;

  /** The reader is `t1` and he plays `t2` next. */
  const squads = { mine: "t1", opponent: "t2", name: (id: string) => ({ t1: "Mine", t2: "Theirs" })[id] ?? null };

  it("files the reader's own squad and his next opponent, and nobody else", () => {
    // Craig, 17 Sep 2026: "only show MY teams player news for injuries, and my
    // next opponent". A third manager's doubt is somebody else's problem — see
    // `doubts.ts` on why the pair is the list that is both short and complete.
    const notes = [note(), note({ teamId: "t2" }), note({ teamId: "t3" })];
    expect(availabilityNews(notes, 5, squads).map((i) => i.teamId)).toEqual(["t1", "t2"]);
  });

  it("gives a signed-out reader the whole league rather than an empty tab", () => {
    // "Only mine" is a sentence about a reader who HAS one. The league's injury
    // list is public football news; all he loses is the ink and the word "you".
    const notes = [note(), note({ teamId: "t2" }), note({ teamId: "t3" })];
    const items = availabilityNews(notes, 5, { ...squads, mine: null, opponent: null });
    expect(items).toHaveLength(3);
    expect(items[0].from).toBe("Mine's physio");
    expect(items[0].about).toBeNull();
    expect(items[0].urgent).toBe(false);
  });

  it("comes from the desk that would know", () => {
    // Craig, 17 Sep 2026: "lets have more fun, so an injury news, could be from
    // the physio". A knock is the medical desk's letter, a ban is the governing
    // body's, and a man who has joined Al Hilal is the transfer desk's — which
    // is the case Craig himself was unsure of.
    expect(availabilityNews([note()], 5, squads)[0].from).toBe("Your physio");
    expect(availabilityNews([banned()], 5, squads)[0].from).toBe("The FA");
    expect(
      availabilityNews([note({ state: "unavailable", label: "Unav", out: true })], 5, squads)[0].from,
    ).toBe("The transfer desk");
  });

  it("says whose man he is, and says it on the line the sender cannot carry", () => {
    // "test3" is a team name a reader has to place, and he should not have to: `about` says it.
    const [mine, theirs] = availabilityNews([note(), note({ teamId: "t2" })], 5, squads);
    expect(mine.from).toBe("Your physio");
    expect(mine.about).toBeNull();
    // The opponent's man is your scout's report, whatever the reason.
    expect(theirs.from).toBe("Your scout");
    expect(theirs.about).toBe("Theirs, your gameweek 5 opponent");
    const [ban] = availabilityNews([banned({ teamId: "t2" })], 5, squads);
    expect(ban.from).toBe("Your scout");
    expect(ban.about).toBe("Theirs, your gameweek 5 opponent");
    // Signed out, the man's own club desk signs it; "Theirs" ends in s, so the apostrophe stands alone.
    const [league] = availabilityNews([note({ teamId: "t2" })], 5, { ...squads, mine: null, opponent: null });
    expect(league.from).toBe("Theirs' physio");
  });

  it("writes the subject as a short headline on his surname", () => {
    // Craig, 30 Sep 2026: "reword these to look like a real sentence". A surname keeps it on one row at 390.
    const subject = (over: Partial<AvailabilityNote>, gameweek: number | null = 5) =>
      availabilityNews([note(over)], gameweek, squads)[0].headline;
    expect(subject({})).toBe("Isak a doubt for GW5");
    expect(subject(injured)).toBe("Isak out for GW5");
    expect(subject({ state: "suspended", label: "Sus", out: true, chance: null })).toBe("Isak banned for GW5");
    // A man who has left is gone for every gameweek, not one.
    expect(subject({ state: "unavailable", label: "Unav", out: true, chance: null })).toBe("Isak unavailable");
    expect(subject(injured, null)).toBe("Isak out");
    expect(subject({}, null)).toBe("Isak a doubt");
  });

  it("gives no gameweek to a doubt with no chance against it", () => {
    // The note is about the man, not the gameweek.
    expect(availabilityNews([note({ chance: null })], 5, squads)[0].headline).toBe("Isak a doubt");
  });

  it("reads like a reporter's sentence, built only from FPL's facts", () => {
    const body = (over: Partial<AvailabilityNote>, gameweek: number | null = 6) =>
      availabilityNews([note(over)], gameweek, squads)[0].body;

    expect(body({ news: "Muscular injury - 75% chance of playing" })).toMatch(
      /^Alexander Isak has a muscular injury(,| and) .*a doubt for gameweek 6\. He('s given| has) a 75% chance of playing\.$/,
    );
    const knee = body({ ...injured, news: "Knee injury - Unknown return date", chance: null });
    expect(knee).toMatch(/^Alexander Isak has a knee injury and (misses|won't play in) gameweek 6\./);
    expect(knee).toMatch(/no (date|word) yet/);
    expect(body({ ...injured, news: "Hamstring injury - Expected back 11 Oct" })).toMatch(/back (by|on) 11 Oct\.$/);
    expect(body({ news: "Unspecified injury - 75% chance of playing" })).toContain("has an injury");
    expect(body({ news: "Knock", chance: null })).toBe("Alexander Isak has a knock and is a doubt for gameweek 6.");
    // The league's word, never "round", when no gameweek is known.
    expect(body({ news: "Knock", chance: null }, null)).toBe(
      "Alexander Isak has a knock and is a doubt for the next gameweek.",
    );
  });

  it("never joins fragments with a dash or a colon, and never says round", () => {
    const cases: Partial<AvailabilityNote>[] = [
      {},
      { news: "Knock - Game-time decision" },
      { news: "Knock", chance: null },
      { ...injured, news: "Knee injury - Unknown return date" },
      { ...injured, news: "Hamstring injury - Expected back 11 Oct" },
      { state: "suspended", label: "Sus", out: true, chance: null, news: "Suspended until 10 Oct" },
    ];
    for (const teamId of ["t1", "t2"]) {
      for (const gameweek of [6, null]) {
        for (const over of cases) {
          const [item] = availabilityNews([note({ teamId, ...over })], gameweek, squads);
          // FPL's own words may arrive in quotes; everything outside them is ours.
          expect(item.body.replace(/"[^"]*"/g, "")).not.toMatch(/ - |:|;|—/);
          expect(`${item.headline} ${item.body}`).not.toMatch(/\bround\b/);
        }
      }
    }
  });

  it("writes a ban and a move plainly", () => {
    const [ban] = availabilityNews([banned({ news: "Suspended until 10 Oct" })], 5, squads);
    expect(ban.body).toBe("Alexander Isak is suspended for gameweek 5. His ban runs until 10 Oct.");
    expect(availabilityNews([banned()], 5, squads)[0].body).toBe("Alexander Isak is suspended for gameweek 5.");
    const [moved] = availabilityNews(
      [banned({ state: "unavailable", label: "Unav", news: "Has joined Birmingham on loan for the rest of the season" })],
      5,
      squads,
    );
    expect(moved.body).toBe(
      "Alexander Isak has joined Birmingham on loan for the rest of the season, so he's no longer available to you.",
    );
  });

  it("puts the opponent's loss in his name, not in yours", () => {
    const [item] = availabilityNews([banned({ teamId: "t2", news: "Suspended until 10 Oct" })], 5, squads);
    expect(item.body).toBe("Theirs will be without Alexander Isak for gameweek 5. He is suspended until 10 Oct.");
    expect(availabilityNews([note({ teamId: "t2" })], 5, squads)[0].body).toMatch(/Theirs/);
  });

  it("quotes FPL's words whole when it cannot read them", () => {
    expect(availabilityNews([note({ news: "Knock - Game-time decision" })], 5, squads)[0].body).toBe(
      'Alexander Isak is a doubt for gameweek 5. The latest update says "Knock - Game-time decision".',
    );
  });

  it("carries FPL's own stamp rather than the round it was read in", () => {
    // `news_added` is non-null on 198 of the 198 elements carrying a note,
    // counted live 17 Sep 2026. This builder used to set `at: null` on the
    // written belief that FPL publishes no "as of".
    const [item] = availabilityNews([note()], 5, squads);
    expect(item.at).toBe("2026-09-15T19:30:09Z");
    expect(item.gameweek).toBe(5);
    // And a note with no stamp still falls back to its round, which is what the
    // blue block drew for every doubt until today.
    expect(availabilityNews([note({ newsAt: null })], 5, squads)[0].at).toBeNull();
  });

  it("carries the football layer's own box, filled only for an absence", () => {
    expect(availabilityNews([banned()], 5, squads)[0].mark).toEqual({ label: "Sus", out: true, band: "out" });
    expect(availabilityNews([note()], 5, squads)[0].mark).toEqual({ label: "Dbt", out: false, band: "slight" });
    expect(availabilityNews([note({ chance: 25 })], 5, squads)[0].mark?.band).toBe("major");
  });

  it("goes red only for the reader's OWN man, and only when he is out", () => {
    // Red is the row he has to act on before the deadline. The opponent losing a
    // player is news and not bad news — the filled box says OUT on both.
    expect(availabilityNews([banned()], 5, squads)[0].urgent).toBe(true);
    expect(availabilityNews([banned({ teamId: "t2" })], 5, squads)[0].urgent).toBe(false);
    // A doubt is not an absence, however low the number.
    expect(availabilityNews([note({ chance: 25 })], 5, squads)[0].urgent).toBe(false);
  });

  it("keys an item by his team as well as his name", () => {
    // FPL's `web_name` is not unique — 17 of the 656 in the pool are shared and
    // `Wilson` is three men. Two items with one id is a repeated key and a row
    // `?item=` can never reach.
    const [a, b] = availabilityNews(
      [note({ playerName: "Wilson" }), note({ playerName: "Wilson", teamId: "t2" })],
      5,
      squads,
    );
    expect(a.id).not.toBe(b.id);
  });

  it("still drops a man nobody in the league holds", () => {
    // The pool's boundary, and it survives every change to the reader's filter:
    // a free agent's news belongs on the pool, where somebody can act on it.
    expect(availabilityNews([note({ teamId: null })], 5, squads)).toEqual([]);
    expect(
      availabilityNews([note({ teamId: null })], 5, { ...squads, mine: null, opponent: null }),
    ).toEqual([]);
  });

  it("files nothing for the opponent when there is no fixture", () => {
    // A reader between rounds has a squad and no opponent, which is his own men
    // and nothing else rather than the whole league back again.
    const notes = [note(), note({ teamId: "t2" })];
    expect(
      availabilityNews(notes, 5, { ...squads, opponent: null }).map((i) => i.teamId),
    ).toEqual(["t1"]);
  });
});
