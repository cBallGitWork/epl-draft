import { describe, expect, it } from "vitest";
import { injuredOff, injuryMinutes, saysInjury } from "./injuries";
import type { RawPlEvent } from "./raw";

// The one fact on these screens read from Opta's prose: the test is a sentence, the answer an id.

describe("injuredOff", () => {
  /** Opta's own sentence, with the two men as `[on, off]` — the order checked
   *  against the fixture feed's own ON/OFF rows for the same minute. */
  const sub = (text: string, ids?: number[]): RawPlEvent => ({
    id: 1,
    type: "substitution",
    text,
    time: { secs: 0, label: "74" },
    playerIds: ids,
  });
  const named = new Map([
    [24659, 1_024_659],
    [129096, 1_129_096],
  ]);

  it("credits the man going OFF, who is the second id", () => {
    const hurt = injuredOff(
      [sub("Substitution, Brentford. Jannik Schuster replaces Nathan Collins because of an injury.", [129096, 24659])],
      named,
    );
    expect([...hurt]).toEqual([1_024_659]);
  });

  it("leaves an ordinary substitution alone", () => {
    expect(
      injuredOff([sub("Substitution, IPS. Kasey McAteer replaces Abdul Fatawu.", [129096, 24659])], named).size,
    ).toBe(0);
  });

  it("reads the phrase and never the name", () => {
    // The TEST is a sentence and the ANSWER is an id. A man the feed calls
    // something else is still found.
    const hurt = injuredOff([sub("Substitution, X. Somebody Else replaces Someone because of an injury.", [129096, 24659])], named);
    expect([...hurt]).toEqual([1_024_659]);
  });

  it("credits nobody when the line carries no second man", () => {
    expect(injuredOff([sub("Substitution because of an injury.", [129096])], named).size).toBe(0);
    expect(injuredOff([sub("Substitution because of an injury.")], named).size).toBe(0);
  });

  it("ignores a man the bridge cannot place", () => {
    expect(injuredOff([sub("X replaces Y because of an injury.", [1, 2])], named).size).toBe(0);
  });

  it("refuses the `start delay` injury, which names its man in prose only", () => {
    const delay: RawPlEvent = {
      id: 2,
      type: "start delay",
      text: "Delay in match because of an injury Nathan Collins (Brentford).",
      time: { secs: 0, label: "20" },
    };
    expect(injuredOff([delay], named).size).toBe(0);
  });

  it("finds every injury in a feed, not just the first", () => {
    const two = [
      sub("A replaces B because of an injury.", [129096, 24659]),
      sub("C replaces D because of an injury.", [24659, 129096]),
    ];
    expect(injuredOff(two, named).size).toBe(2);
  });
});

describe("saysInjury", () => {
  it("is true only for a SUBSTITUTION carrying the phrase", () => {
    expect(saysInjury({ type: "substitution", text: "A replaces B because of an injury." })).toBe(true);
  });

  it("is false for an ordinary change", () => {
    expect(saysInjury({ type: "substitution", text: "A replaces B." })).toBe(false);
  });

  it("is false for the start delay, which is a different fact", () => {
    // Treated and played on, and its man is named in prose only.
    expect(
      saysInjury({ type: "start delay", text: "Delay in match because of an injury X (Y)." }),
    ).toBe(false);
  });
});

describe("injuryMinutes", () => {
  const named = new Map([[24659, 1_024_659]]);
  const sub = (label: string): RawPlEvent => ({
    id: 1,
    type: "substitution",
    text: "A replaces B because of an injury.",
    time: { secs: 0, label },
    playerIds: [129096, 24659],
  });

  it("gives the minute he went off", () => {
    expect(injuryMinutes([sub("74")], named).get(1_024_659)).toBe(74);
  });

  it("drops added time, the same rule every other minute here states", () => {
    expect(injuryMinutes([sub("90+3")], named).get(1_024_659)).toBe(90);
  });

  it("skips a line with no clock rather than placing him at kick-off", () => {
    const noClock: RawPlEvent = {
      id: 2,
      type: "substitution",
      text: "A replaces B because of an injury.",
      playerIds: [129096, 24659],
    };
    expect(injuryMinutes([noClock], named).size).toBe(0);
  });
});
