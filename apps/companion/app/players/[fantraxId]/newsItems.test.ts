import { describe, expect, it } from "vitest";
import { inbox } from "./newsItems";

const story = (headline: string, content: string) => ({ id: "1", headline, content, analysis: null, at: 1 });

describe("inbox", () => {
  it("gives a headline Fantrax cut short its whole first sentence back", () => {
    // Craig, 25 Sep 2026: "text on preview line cuts off too early".
    const [item] = inbox([
      story(
        "Haaland scored two goals to go with six shots (four on goal) and one chance created in Tuesday's...",
        "Haaland scored two goals to go with six shots (four on goal) and one chance created in Tuesday's 2-0 UCL win over Porto. He was subbed at 80.",
      ),
    ]);
    expect(item.headline).toBe(
      "Haaland scored two goals to go with six shots (four on goal) and one chance created in Tuesday's 2-0 UCL win over Porto.",
    );
  });

  it("leaves a whole headline alone, and one the story does not begin with", () => {
    expect(inbox([story("Haaland is back in Manchester.", "Other words.")])[0].headline).toBe("Haaland is back in Manchester.");
    expect(inbox([story("Haaland (heel) is fit...", "According to Pep, Haaland is fit.")])[0].headline).toBe("Haaland (heel) is fit...");
  });
});
