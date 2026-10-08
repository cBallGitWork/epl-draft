import { describe, expect, it } from "vitest";
import { checkLawro, pencil } from "./checks";
import { SAMPLE, TEAMS, ctx, draft } from "./__fixtures__/column";

const serious = (faults: ReturnType<typeof checkLawro>) => faults.filter((each) => each.severity !== "warn");

describe("checkLawro", () => {
  it("passes the sample column untouched", () => {
    expect(serious(checkLawro(draft(), ctx()))).toEqual([]);
  });

  it("refuses the chatbot's version of the first tie on every count it names", () => {
    const slop = "So, the table-toppers welcome the basement boys — and it's shaping up to be a real David vs Goliath clash! Real Sociable boast a perfect record and serious firepower, with Oduya (projected 9.2) starting against a leaky Leeds defence. But this isn't just about form; it's about belief. Bayer Neverlusen have delved into the waiver wire for Pym and Kettle, and they've benched Castell in a bid to turn the tide... Only time will tell, but all eyes will be on the new boys.";
    const faults = checkLawro(draft([["rs-bn", slop], ...SAMPLE.slice(1)]), ctx()).filter((each) => each.section === "rs-bn");
    const hard = faults.filter((each) => each.severity === "hard").map((each) => `${each.check}: ${each.evidence}`);
    expect(hard).toEqual(expect.arrayContaining(["line-up: benched", "line-up: starting against", "a decimal: 9.2", "a name not in the brief: Goliath", "a name not in the brief: Castell"]));
    const sent = faults.filter((each) => each.severity === "send-back").map((each) => each.evidence);
    for (const tell of ["table-toppers", "shaping up", "clash", "boast", "firepower", "leaky", "belief", "delved", "in a bid to", "turn the tide", "only time will tell", "all eyes", "projected", "welcome", ";", "...", "n't just"]) {
      expect(sent).toContain(tell);
    }
  });

  it("refuses a tie the writer backed the wrong way, or argued for the other side", () => {
    const turned = draft(SAMPLE, {});
    (turned.ties as Map<string, { line: string; backs: string | null }>).set("rs-bn", { line: SAMPLE[0][1], backs: "bn" });
    expect(checkLawro(turned, ctx()).map((each) => each.check)).toContain("backs another side");
    const argued = draft([["rs-bn", "Bayer Neverlusen will win this. Real Sociable have won all three."], ...SAMPLE.slice(1)]);
    expect(checkLawro(argued, ctx()).find((each) => each.check === "argues for the other side")?.severity).toBe("hard");
  });

  it("refuses a missing tie, a score in the prose and a career nobody gave him", () => {
    const faults = checkLawro(
      draft([["rs-bn", "Real Sociable win 52-42. I managed Oxford once."], ...SAMPLE.slice(2)], {}),
      ctx(),
    );
    const found = faults.filter((each) => each.severity === "hard").map((each) => each.check);
    expect(found).toEqual(expect.arrayContaining(["missing", "a score in the prose", "a career claim nobody gave him"]));
  });

  it("lets him say how far he has come down, and still refuses a career nobody gave him", () => {
    const hardIn = (line: string) =>
      checkLawro(draft([["rs-bn", line], ...SAMPLE.slice(1)]), ctx()).filter((each) => each.section === "rs-bn" && each.severity === "hard").map((each) => each.check);
    expect(hardIn("My career has come to this. Real Sociable have won all three. They'll need more than two.")).toEqual([]);
    expect(hardIn("My career was full of goals. Real Sociable have won all three.")).toContain("a career claim nobody gave him");
  });

  it("reads a word standing as its own sentence as a reaction, not a stranger", () => {
    const hard = checkLawro(draft([["rs-bn", "I've no argument with Real Sociable. Lovely. Oduya has Leeds."], ...SAMPLE.slice(1)]), ctx());
    expect(hard.filter((each) => each.check === "a name not in the brief")).toEqual([]);
  });

  it("lets a real club host, and sends back a league side that does", () => {
    const home = (line: string) =>
      checkLawro(draft([["rs-bn", line], ...SAMPLE.slice(1)]), ctx()).filter((each) => each.check === "a league side at home").map((each) => each.evidence);
    expect(home("Oduya has Leeds, and Arsenal host them. Real Sociable win it.")).toEqual([]);
    expect(home("Real Sociable host Bayer Neverlusen. Real Sociable win it.")).toEqual(["Real Sociable host"]);
  });

  it("sends back a phrase said in two ties of the same column", () => {
    const twice = draft([["rs-bn", "I'd want to see him warm up first. Real Sociable win it."], ["im-bt", "I'd want to see him warm up first. Borussia Teeth."], ...SAMPLE.slice(2)]);
    const faults = checkLawro(twice, ctx()).filter((each) => each.check === "the same phrase as another tie");
    expect(faults.map((each) => each.section)).toEqual(["im-bt"]);
  });

  it("sends back Liverpool given as the reason on a Liverpool call", () => {
    const faults = checkLawro(draft([["nf-sc", "Nottingham Florist are favourites, just. A Liverpool man always turns up. I'm taking Sporting Chance."], ...SAMPLE.filter(([key]) => key !== "nf-sc")]), ctx());
    expect(faults.filter((each) => each.check === "gives Liverpool as the reason").map((each) => each.evidence)).toEqual(["Liverpool man"]);
  });

  it("sends back a possessive before a man's name", () => {
    const faults = checkLawro(draft([["rs-bn", "Their Oduya has Leeds. I'll go with Real Sociable."], ...SAMPLE.slice(1)]), ctx({ names: [...Object.values(TEAMS), "Oduya"] }));
    expect(faults.filter((each) => each.check === "a possessive before a name").map((each) => each.evidence)).toEqual(["Their Oduya"]);
  });

  it("sends back a chance in figures, which he says in words", () => {
    const faults = checkLawro(draft([["rs-bn", "Oduya is a 50-50, and Pym is 75 per cent. Real Sociable win it."], ...SAMPLE.slice(1)]), ctx());
    expect(faults.filter((each) => each.check === "banned").map((each) => each.evidence)).toEqual(expect.arrayContaining(["50-50", "per cent"]));
  });

  it("sends back a phrase he used in a recent column, and a habit used twice", () => {
    const past = ["Real Sociable, and I'd want to see him warm up first."];
    expect(checkLawro(draft(), ctx({ past })).some((each) => each.check === "a phrase from a recent column")).toBe(true);
    const habit = draft([["rs-bn", "On paper it's Real Sociable. On paper it's easy. They'll need more than two."], ...SAMPLE.slice(1)]);
    expect(checkLawro(habit, ctx()).map((each) => each.evidence)).toContain("on paper ×3");
  });

  it("sends back an American -ize, in his deck as in his ties", () => {
    const faults = checkLawro(draft([["rs-bn", `${SAMPLE[0][1]} I realized that on Wednesday.`], ...SAMPLE.slice(1)], { deck: "Lawro has organized his calls." }), ctx());
    expect(faults.filter((each) => each.check === "not British football English").map((each) => `${each.section}: ${each.evidence}`)).toEqual(["deck: organized", "rs-bn: realized"]);
  });
});

describe("pencil", () => {
  it("fixes the trivial slips and leaves a hyphenated name alone", () => {
    expect(pencil("So, they win! Gibbs-White — again. 49–41.")).toBe("They win. Gibbs-White, again. 49-41.");
    expect(pencil("So far so good")).toBe("So far so good");
  });
});
