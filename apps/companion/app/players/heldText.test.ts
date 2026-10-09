import { describe, expect, it } from "vitest";
import { heldText } from "./heldText";

describe("heldText", () => {
  it("keeps what was typed after the box's own search went, when the page answers it", () => {
    // "sal" settled and went; "ah" was typed while the server answered.
    expect(heldText("sal", "sal", "salah")).toBe("salah");
  });

  it("takes the URL's text after any other navigation, such as Back", () => {
    expect(heldText("kane", "sal", "salah")).toBe("kane");
  });

  it("takes the URL's text before the box has sent anything", () => {
    expect(heldText("", null, "sa")).toBe("");
  });
});
