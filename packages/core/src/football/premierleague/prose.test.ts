import { describe, expect, it } from "vitest";
import { plWireLines, shortProse, proseSpans } from "./prose";

// Every sentence here is Opta's own, taken verbatim off the live textstream on
// 5 Sep 2026 (`data/probes/2026-09-05/`). Nothing is invented, because the whole
// point of this wire is that the words are the game's.
const NAMES = new Map([
  ["Newcastle United", "Newcastle"],
  ["Bournemouth", "Bournemouth"],
  ["Arsenal", "Arsenal"],
  ["Coventry City", "Coventry"],
  ["Brighton and Hove Albion", "Brighton"],
  ["Aston Villa", "Villa"],
  ["Tottenham Hotspur", "Tottenham"],
  ["Tottenham", "Spurs"],
]);

describe("shortProse", () => {
  it("shortens the scoreline and drops the club in brackets", () => {
    expect(
      shortProse(
        "Goal! Arsenal 1, Coventry City 0. Kai Havertz (Arsenal) left footed shot from the centre of the box to the bottom right corner. Assisted by Riccardo Calafiori.",
        NAMES,
      ),
    ).toBe(
      "Goal! Arsenal 1, Coventry 0. Kai Havertz left footed shot from the centre of the box to the bottom right corner. Assisted by Riccardo Calafiori.",
    );
  });

  it("keeps a VAR line readable, which is the one Craig asked for by name", () => {
    expect(
      shortProse(
        "GOAL OVERTURNED BY VAR: Florian Wirtz (Liverpool) scores but the goal is ruled out after a VAR review.",
        new Map([["Liverpool", "Liverpool"]]),
      ),
    ).toBe("GOAL OVERTURNED BY VAR: Florian Wirtz scores but the goal is ruled out after a VAR review.");
  });

  // The fantasy assist for a penalty: our league pays the man who won it, and
  // Opta names him. No join and no inference — the sentence already says it.
  it("carries the man who won a penalty", () => {
    expect(
      shortProse("Penalty Brentford. Kevin Schade draws a foul in the penalty area.", NAMES),
    ).toBe("Penalty Brentford. Kevin Schade draws a foul in the penalty area.");
  });

  it("shortens an own goal's two clauses", () => {
    expect(
      shortProse(
        "Own Goal by Victor Lindelöf, Aston Villa. Brighton and Hove Albion 1, Aston Villa 0.",
        NAMES,
      ),
    ).toBe("Own Goal by Victor Lindelöf, Villa. Brighton 1, Villa 0.");
  });

  // **The reason the sort is by length.** "Tottenham" is a prefix of "Tottenham
  // Hotspur", so replacing in map order would leave " Hotspur" stranded.
  it("never lets a shorter name eat a longer one", () => {
    expect(shortProse("Tottenham Hotspur 2, Arsenal 1.", NAMES)).toBe("Tottenham 2, Arsenal 1.");
  });

  it("leaves a sentence naming no club we know exactly as it found it", () => {
    const line = "Attempt missed. Somebody from outside the box is high and wide to the left.";
    expect(shortProse(line, NAMES)).toBe(line);
    expect(shortProse(line, new Map())).toBe(line);
  });
});

// The wire's own reduction. Every `type` and `text` here is Opta's, off the live
// textstream on 5 Sep 2026 (`data/probes/2026-09-05/`).
const line = (over: Partial<{ id: number; type: string; minute: string; seconds: number; text: string }>) => ({
  id: 1,
  type: "goal",
  minute: "15",
  seconds: 900,
  text: "Goal! Arsenal 1, Coventry City 0. Kai Havertz (Arsenal) scores.",
  ...over,
});

describe("plWireLines", () => {
  // The finding this function exists to make testable: unfiltered, the first ten
  // lines of a round were four free kicks, an added-time announcement and two
  // missed shots — 642 `free kick lost` across three gameweeks.
  it("prints nine of Opta's types and drops the firehose", () => {
    const kept = ["goal", "penalty goal", "own goal", "VAR cancelled goal", "penalty won", "yellow card", "red card", "substitution", "end 14"];
    const dropped = ["free kick lost", "free kick won", "miss", "corner", "attempt blocked", "attempt saved", "offside", "added time", "lineup", "start", "end 1", "end 2", "post"];

    for (const type of kept) {
      expect(plWireLines(1, [line({ type })], NAMES, 5760)).toHaveLength(1);
    }
    for (const type of dropped) {
      expect(plWireLines(1, [line({ type })], NAMES, 5760)).toHaveLength(0);
    }
  });

  // `end 2` is "Second Half ends" and `end 14` is "Match ends". A wire printing
  // both says full time twice.
  it("takes full time from `end 14` and not from `end 2`", () => {
    expect(plWireLines(1, [line({ type: "end 2" })], NAMES, 5760)).toHaveLength(0);
    expect(plWireLines(1, [line({ type: "end 14" })], NAMES, 5760)[0]?.minute).toBe("FT");
  });

  // **The bug this was written against.** `end 14` carries `{secs: 0, label:
  // "01"}` — a junk clock that `plCommentary` cannot drop, because the event DOES
  // have a time. Left alone it sorts to kick-off, above every goal in its own
  // match, and prints `01′`.
  it("gives full time the fixture's final whistle, not its own junk clock", () => {
    const ends = line({ type: "end 14", minute: "01", seconds: 0, text: "Match ends, Arsenal 3, Coventry City 0." });
    const [row] = plWireLines(1, [ends], NAMES, 5760);
    expect(row.seconds).toBe(5760);
    expect(row.minute).toBe("FT");
    expect(row.text).toBe("Match ends, Arsenal 3, Coventry 0.");
  });

  it("falls back to the event's own clock when the fixture gives none", () => {
    const ends = line({ type: "end 14", seconds: 0 });
    expect(plWireLines(1, [ends], NAMES, null)[0]?.seconds).toBe(0);
  });

  // An event id is unique within a stream and not across a round, so two matches
  // would collide on it and React would key two rows the same.
  it("keys a line by its fixture as well as its event", () => {
    expect(plWireLines(128949, [line({ id: 7 })], NAMES, null)[0]?.id).toBe("128949:7");
    expect(plWireLines(128951, [line({ id: 7 })], NAMES, null)[0]?.id).toBe("128951:7");
  });

  it("shortens every line it keeps", () => {
    const [row] = plWireLines(1, [line({})], NAMES, null);
    expect(row.text).toBe("Goal! Arsenal 1, Coventry 0. Kai Havertz scores.");
  });
});

describe("proseSpans", () => {
  const men = ["Bryan Mbeumo", "Chuba Akpom", "Kjell Scherpen", "Julio Enciso", "Iwobi"];

  it("takes the opening clause as the event", () => {
    const spans = proseSpans("Attempt blocked. Bryan Mbeumo left footed shot is blocked.", men);
    expect(spans[0]).toEqual({ text: "Attempt blocked.", kind: "event" });
  });

  it("closes the event on a bang as well as a full stop", () => {
    expect(proseSpans("Goal! MUN 5, IPS 2.", men)[0]).toEqual({ text: "Goal!", kind: "event" });
  });

  it("marks a man both sheets know", () => {
    const spans = proseSpans("Corner, MUN. Conceded by Kjell Scherpen.", men);
    expect(spans.filter((s) => s.kind === "name").map((s) => s.text)).toEqual(["Kjell Scherpen"]);
  });

  it("marks every man in a line, not just the first", () => {
    const spans = proseSpans(
      "Attempt saved. Chuba Akpom header is saved. Assisted by Julio Enciso.",
      men,
    );
    expect(spans.filter((s) => s.kind === "name").map((s) => s.text)).toEqual([
      "Chuba Akpom",
      "Julio Enciso",
    ]);
  });

  it("prefers the longest name, so a surname does not eat a full one", () => {
    const spans = proseSpans("Sub. Rodrigo Muniz replaces Alex Iwobi.", ["Iwobi", "Alex Iwobi"]);
    expect(spans.filter((s) => s.kind === "name").map((s) => s.text)).toEqual(["Alex Iwobi"]);
  });

  it("marks nothing a capital alone would have caught", () => {
    // `Second Half`, `MUN` and `VAR` are not men, and a pattern over capitals
    // would have taken all three.
    const spans = proseSpans("Second Half ends, MUN 5, IPS 2.", men);
    expect(spans.some((s) => s.kind === "name")).toBe(false);
  });

  it("paraphrases nothing — the spans rebuild the sentence exactly", () => {
    const said = "Attempt blocked. Bryan Mbeumo left footed shot is blocked. Assisted by Iwobi.";
    expect(
      proseSpans(said, men)
        .map((s) => s.text)
        .join(""),
    ).toBe(said);
  });

  it("returns one span for a line with no full stop at all", () => {
    expect(proseSpans("Lineups are announced", men)).toEqual([
      { text: "Lineups are announced", kind: "event" },
    ]);
  });

  it("has nothing to mark when no names are known", () => {
    const spans = proseSpans("Attempt blocked. Bryan Mbeumo left footed shot.", []);
    expect(spans.filter((s) => s.kind === "name")).toHaveLength(0);
    expect(spans.map((s) => s.text).join("")).toBe(
      "Attempt blocked. Bryan Mbeumo left footed shot.",
    );
  });
});
