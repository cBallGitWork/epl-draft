import { describe, expect, it } from "vitest";
import { REPORT_NEVER, wordFaults } from "./style";

const faultsIn = (text: string) => {
  const out: string[] = [];
  wordFaults("x", text, true, [], (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
  return out;
};

describe("wordFaults", () => {
  it("sends a banned phrase back once, however many lists carry it", () => {
    expect(faultsIn("Their profligacy cost them.")).toEqual(["a phrase this paper does not print: profligacy"]);
    expect(new Set(REPORT_NEVER).size).toBe(REPORT_NEVER.length);
  });

  it("catches the Englishman as it catches the Frenchman", () => {
    expect(faultsIn("The Englishman scored.")).toContain("a man called anything but his name: The Englishman");
    expect(faultsIn("The Frenchman scored.")).toContain("a man called anything but his name: The Frenchman");
  });
});
