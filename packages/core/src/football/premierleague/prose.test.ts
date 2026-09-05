import { describe, expect, it } from "vitest";
import { shortProse } from "./prose";

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
