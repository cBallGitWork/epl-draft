import { describe, expect, it } from "vitest";
import { checkTrade } from "./checks";

const BRIEF = [
  "THE DEAL",
  "- Truffles get Gabriel Magalhaes (D, Arsenal) from Beef. His season: 34 points, 2 goals.",
  "- Beef get Adrien Truffert (D, Bournemouth) from Truffles. His season: 21 points, no goals.",
  "It takes effect in gameweek 8.",
].join("\n");
const NAMES = ["Gabriel Magalhaes", "Adrien Truffert", "Truffles", "Beef", "Arsenal", "Bournemouth"];

const GOOD =
  "Gabriel Magalhaes joins Truffles, deal done. Adrien Truffert goes the other way to Beef. The Arsenal man has 34 points and two goals so far. It takes effect in gameweek eight.";

const faults = (body: string) => checkTrade({ body }, { brief: BRIEF, names: NAMES }).map((f) => `${f.severity}: ${f.check} (${f.evidence})`);

describe("checkTrade", () => {
  it("passes a short item that says only what the brief gave it", () => {
    expect(faults(GOOD)).toEqual([]);
  });

  it("refuses a fee, a medical or any other part of a real transfer a draft trade does not have", () => {
    expect(faults("Gabriel Magalhaes joins Truffles for a fee. Medical booked for tomorrow.")).toEqual([
      "hard: a draft trade has no fee, medical, contract or agent (fee)",
      "hard: a draft trade has no fee, medical, contract or agent (medical)",
    ]);
    expect(faults("Gabriel Magalhaes joins Truffles. Truffert to Beef, all £40m.")).toContain(
      "hard: a draft trade has no fee, medical, contract or agent (£)",
    );
  });

  it("refuses a figure or a man the brief does not hold", () => {
    expect(faults("Gabriel Magalhaes joins Truffles. He has 40 points and Saka is next.")).toEqual([
      "hard: a figure not in the brief (40)",
      "hard: a name not in the brief (Saka)",
    ]);
  });

  it("sends back an item that is too long, too short, prints an emoji or writes the desk's sign-off", () => {
    expect(faults("Gabriel Magalhaes joins Truffles.")).toEqual(["send-back: length (1 sentences, 4 words)"]);
    expect(faults(`${GOOD} ${GOOD}`)).toEqual([expect.stringMatching(/^send-back: length \(8 sentences/u)]);
    expect(faults("Gabriel Magalhaes joins Truffles ✅. Adrien Truffert to Beef.")).toEqual(["send-back: no emoji: the paper prints words (✅)"]);
    expect(faults("Gabriel Magalhaes to Truffles, here we go. Adrien Truffert to Beef.")).toEqual([
      "send-back: the desk prints the sign-off (here we go)",
    ]);
  });

  it("refuses a source and sends back American English", () => {
    expect(faults("Gabriel Magalhaes joins Truffles. Per Fantrax, Adrien Truffert goes to Beef.")[0]).toBe(
      "hard: names a source or a percentage (Per F)",
    );
    expect(faults("Gabriel Magalhaes joins Truffles to organize the defense. Adrien Truffert goes to Beef.")).toContain(
      "send-back: not British football English (organize)",
    );
  });
});
