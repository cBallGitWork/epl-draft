import { describe, expect, it } from "vitest";
import { standingHeadlines } from "./standing";

describe("standingHeadlines", () => {
  it("names what is already in print, and says what may not be repeated", () => {
    const block = standingHeadlines(["Sunderland Bank The Sheet", "Gibbs-White Whites Out test31"]);
    expect(block).toContain("Sunderland Bank The Sheet");
    expect(block).toContain("Gibbs-White Whites Out test31");
    expect(block).toContain("not the same verb");
  });

  it("prints nothing on an empty page rather than an empty heading", () => {
    // A brief padded with a heading it has nothing for is a brief inviting the
    // model to fill it — the rule the whole `buildBrief` block list follows.
    expect(standingHeadlines([])).toBeNull();
    expect(standingHeadlines(["", ""])).toBeNull();
  });

  it("stops at a front page's worth, because that is what a reader sees at once", () => {
    const many = Array.from({ length: 20 }, (_, at) => `Headline ${at}`);
    const block = standingHeadlines(many);
    expect(block).toContain("Headline 11");
    expect(block).not.toContain("Headline 12");
  });
});
