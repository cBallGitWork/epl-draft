import { describe, expect, it } from "vitest";
import { filedAt, inbox, noteBody } from "./newsItems";

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

describe("noteBody", () => {
  const item = (headline: string, body: string, analysis: string | null) => ({ id: "1", headline, body, analysis, at: 1 });

  it("never repeats the headline, and keeps the analysis as its own paragraph", () => {
    // Craig, 30 Sep 2026: the analysis is "good info, and its buried".
    expect(
      noteBody(item("Semenyo (ankle) left camp.", "Semenyo (ankle) left camp. He will have tests.", "He could face Liverpool.")),
    ).toEqual(["He will have tests.", "He could face Liverpool."]);
  });

  it("says nothing more when the headline was the whole story and there is no analysis", () => {
    expect(noteBody(item("Saka is fit.", "Saka is fit.", null))).toEqual([]);
  });

  it("keeps a body the headline does not begin, and drops a blank analysis", () => {
    expect(noteBody(item("Palmer doubtful", "According to Maresca, Palmer is doubtful.", " "))).toEqual([
      "According to Maresca, Palmer is doubtful.",
    ]);
  });
});

describe("filedAt", () => {
  it("reads the epoch as an ISO moment, and a dateless note as null", () => {
    const item = (at: number | null) => ({ id: "1", headline: "h", body: "b", analysis: null, at });
    expect(filedAt(item(Date.UTC(2026, 8, 22, 19, 12)))).toBe("2026-09-22T19:12:00.000Z");
    expect(filedAt(item(null))).toBeNull();
  });
});
