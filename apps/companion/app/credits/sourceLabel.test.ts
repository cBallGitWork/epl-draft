import { describe, expect, it } from "vitest";
import { COLUMNISTS, DESK_GROUND_CREDIT } from "../config";
import { sourceLabel } from "./sourceLabel";

describe("a credit's source link", () => {
  it("names Wikimedia Commons for a Commons file", () => {
    expect(sourceLabel(DESK_GROUND_CREDIT?.source ?? "")).toBe("Wikimedia Commons");
  });

  it("names the site a picture came from when it is not Commons", () => {
    // Lawro's photograph is the BBC's, and its link opens BBC Sport.
    expect(sourceLabel(COLUMNISTS["Mark Lawrenson"]?.photo.source ?? "")).toBe("bbc.co.uk");
  });

  it("prints an address it cannot read as it is", () => {
    expect(sourceLabel("not a url")).toBe("not a url");
  });
});
