import { describe, expect, it } from "vitest";
import {
  MAX_COVERED,
  THREAD_MAX_BEATS,
  isCovered,
  normalizeLedger,
  recordCoverage,
  threadSlug,
} from "./ledger";

const LEAGUE = "zbn1z3ukmsgb36sz";
const FILED = "2026-08-31T09:00:00.000Z";

describe("recordCoverage", () => {
  it("spends keys once and answers isCovered", () => {
    const key = "tie-report:p3:avb";
    const ledger = recordCoverage({}, LEAGUE, [key, key], [], FILED);
    expect(ledger[LEAGUE].covered).toEqual([key]);
    expect(isCovered(ledger, LEAGUE, key)).toBe(true);
    expect(isCovered(ledger, "ayyoh3n2mr326v2o", key)).toBe(false);
  });

  it("drops the oldest keys past the cap", () => {
    const keys = Array.from({ length: MAX_COVERED + 5 }, (_, n) => `news:item-${n}`);
    const ledger = recordCoverage({}, LEAGUE, keys, [], FILED);
    expect(ledger[LEAGUE].covered).toHaveLength(MAX_COVERED);
    // A key that old is a round long superseded; the newest must all survive.
    expect(ledger[LEAGUE].covered.at(-1)).toBe(`news:item-${MAX_COVERED + 4}`);
    expect(ledger[LEAGUE].covered[0]).toBe("news:item-5");
  });

  it("opens a thread at one beat and wears it on each advance", () => {
    const opened = recordCoverage({}, LEAGUE, [], [{ subject: "The No.2 overall", beat: "Blanked again." }], FILED);
    const advanced = recordCoverage(
      opened, LEAGUE, [],
      [{ subject: "the no 2 overall", beat: "A hat-trick, at last." }],
      "2026-09-07T09:00:00.000Z",
    );
    const [thread] = advanced[LEAGUE].threads;
    // Two phrasings of one saga are one thread, and the first phrasing is the
    // identity that survives.
    expect(advanced[LEAGUE].threads).toHaveLength(1);
    expect(thread.subject).toBe("The No.2 overall");
    expect(thread.beat).toBe("A hat-trick, at last.");
    expect(thread.beats).toBe(2);
    expect(thread.lastUsedAt).toBe("2026-09-07T09:00:00.000Z");
  });

  it("keeps retirement a one-way door", () => {
    const retired = recordCoverage({}, LEAGUE, [], [{ subject: "s", beat: "Done.", status: "retired" }], FILED);
    const poked = recordCoverage(
      retired, LEAGUE, [],
      [{ subject: "s", beat: "It is back!", status: "open" }],
      "2026-09-07T09:00:00.000Z",
    );
    // A worn joke does not reopen because the model liked it again — the
    // 38-week season's brake is in the data, not in an instruction.
    expect(poked[LEAGUE].threads[0].status).toBe("retired");
  });

  it("leaves other leagues' memory untouched", () => {
    const both = recordCoverage(
      recordCoverage({}, LEAGUE, ["a"], [], FILED),
      "ayyoh3n2mr326v2o", ["b"], [], FILED,
    );
    expect(both[LEAGUE].covered).toEqual(["a"]);
    expect(both["ayyoh3n2mr326v2o"].covered).toEqual(["b"]);
  });
});

describe("normalizeLedger", () => {
  it("coerces an unreadable file to an empty memory and keeps what survives", () => {
    expect(normalizeLedger(null)).toEqual({});
    const survived = normalizeLedger({
      [LEAGUE]: {
        covered: ["ok", 3, ""],
        threads: [
          { subject: "s", beat: "b", status: "open", beats: 2, lastUsedAt: FILED },
          { subject: "", beat: "b", status: "open", beats: 1, lastUsedAt: FILED },
        ],
      },
      "": { covered: [], threads: [] },
    });
    expect(survived[LEAGUE].covered).toEqual(["ok"]);
    expect(survived[LEAGUE].threads).toHaveLength(1);
    expect(survived[""]).toBeUndefined();
  });
});

describe("threadSlug", () => {
  it("collapses case, punctuation and spacing", () => {
    expect(threadSlug("Is Salah finished?")).toBe(threadSlug("is salah FINISHED"));
  });
});

describe("THREAD_MAX_BEATS", () => {
  it("is the wear threshold the brief will read", () => {
    // Recorded as a test so a change to the constant is a decision, not a
    // drive-by: six editions on one joke is already one more than the World
    // Cup paper's readers wanted.
    expect(THREAD_MAX_BEATS).toBe(6);
  });
});
