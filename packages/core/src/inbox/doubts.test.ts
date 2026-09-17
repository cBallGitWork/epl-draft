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
    expect(items[0].from).toBe("Mine");
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
    // The half of the instruction a filter alone would miss: "test3" is a team
    // name a reader has to place, and he should not have to. A physio belongs to
    // a club and can say it himself; the FA cannot, so `about` does.
    const [mine, theirs] = availabilityNews([note(), note({ teamId: "t2" })], 5, squads);
    expect(mine.from).toBe("Your physio");
    expect(mine.about).toBeNull();
    // "Theirs" already ends in an s, so the apostrophe stands alone.
    expect(theirs.from).toBe("Theirs' physio");
    expect(theirs.about).toBe("Theirs, your gameweek 5 opponent");
    // And a ban in the other squad, where the sender is nobody's.
    const [ban] = availabilityNews([banned({ teamId: "t2" })], 5, squads);
    expect(ban.from).toBe("The FA");
    expect(ban.about).toBe("Theirs, your gameweek 5 opponent");
  });

  it("names him in full and says which round, in the subject line", () => {
    // Craig, 17 Sep 2026: "use players first name and surname in email fields"
    // and "say 'player name is out gw4'". A man is out FOR a round and a
    // percentage to play IN one, which is why the clause carries its own
    // preposition.
    expect(availabilityNews([banned()], 5, squads)[0].headline).toBe(
      "Alexander Isak is out for GW5",
    );
    expect(availabilityNews([note()], 5, squads)[0].headline).toBe(
      "Alexander Isak is 75% to play, GW5",
    );
  });

  it("says he is OUT before it says anything about a chance", () => {
    // A ban carries no chance at all, so asking the chance first said "carries a
    // note" about a suspension.
    expect(availabilityNews([note({ chance: null })], 5, squads)[0].headline).toBe(
      "Alexander Isak carries a note",
    );
    // And no round on that one: "carries a note for gameweek 5" claims the note
    // is about the round, and it is about the man.
    expect(availabilityNews([note({ chance: null })], null, squads)[0].headline).toBe(
      "Alexander Isak carries a note",
    );
  });

  it("reads like a letter, and still ends in FPL's own words", () => {
    // Craig, 17 Sep 2026: "lets make this sound like a real email". The body was
    // FPL's note alone, which is a medical string with no subject — "Suspended
    // until 10 Oct." is a fragment, and the screen had to supply the man, the
    // round and the squad around it.
    expect(availabilityNews([banned({ news: "Suspended until 10 Oct" })], 5, squads)[0].body).toBe(
      "You lose Alexander Isak for gameweek 5. Suspended until 10 Oct.",
    );
    expect(availabilityNews([note()], 5, squads)[0].body).toBe(
      "Alexander Isak is a doubt for gameweek 5. Knock - 75% chance of playing.",
    );
  });

  it("puts the opponent's loss in his name, not in yours", () => {
    const [item] = availabilityNews([banned({ teamId: "t2" })], 5, squads);
    expect(item.body).toBe("Theirs lose Alexander Isak for gameweek 5. Suspended.");
    expect(availabilityNews([note({ teamId: "t2" })], 5, squads)[0].body).toBe(
      "Theirs have a doubt over Alexander Isak for gameweek 5. Knock - 75% chance of playing.",
    );
  });

  it("puts a full stop on FPL's note when it has none, and never a second", () => {
    const run = (news: string) => availabilityNews([banned({ news })], 5, squads)[0].body;
    expect(run("Has joined Birmingham on loan for the rest of the season")).toBe(
      "You lose Alexander Isak for gameweek 5. Has joined Birmingham on loan for the rest of the season.",
    );
    expect(run("Suspended.")).toBe("You lose Alexander Isak for gameweek 5. Suspended.");
    // A note FPL left empty leaves our sentence alone rather than a trailing space.
    expect(run("")).toBe("You lose Alexander Isak for gameweek 5.");
  });

  it("carries FPL's own stamp rather than the round it was read in", () => {
    // `news_added` is non-null on 198 of the 198 elements carrying a note,
    // counted live 17 Sep 2026. This builder used to set `at: null` on the
    // written belief that FPL publishes no "as of".
    const [item] = availabilityNews([note()], 5, squads);
    expect(item.at).toEqual({ iso: "2026-09-15T19:30:09Z" });
    expect(item.gameweek).toBe(5);
    // And a note with no stamp still falls back to its round, which is what the
    // blue block drew for every doubt until today.
    expect(availabilityNews([note({ newsAt: null })], 5, squads)[0].at).toBeNull();
  });

  it("carries the football layer's own box, filled only for an absence", () => {
    expect(availabilityNews([banned()], 5, squads)[0].mark).toEqual({ label: "Sus", out: true });
    expect(availabilityNews([note()], 5, squads)[0].mark).toEqual({ label: "Dbt", out: false });
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
