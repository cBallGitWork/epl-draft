import { describe, expect, it } from "vitest";
import { formHref } from "./formHref";

describe("formHref", () => {
  it("carries every filled field, trimmed", () => {
    expect(formHref("/players", [["q", " Saka "], ["sort", "pts"]])).toBe("/players?q=Saka&sort=pts");
  });

  it("drops a field left empty or blank", () => {
    expect(formHref("/players", [["q", "   "], ["sort", ""], ["pos", "F"]])).toBe("/players?pos=F");
  });

  it("is the bare action when nothing is filled", () => {
    expect(formHref("/players", [["q", ""]])).toBe("/players");
  });

  it("keeps the last of a field sent twice", () => {
    expect(formHref("/prem/data", [["list", "goals"], ["list", "assists"]])).toBe("/prem/data?list=assists");
  });

  it("encodes what it carries", () => {
    expect(formHref("/players/analysis", [["qa", "Ødegaard & co"]])).toBe("/players/analysis?qa=%C3%98degaard+%26+co");
  });

  it("leaves out a file, which has no place in a URL", () => {
    expect(formHref("/players", [["photo", new File(["x"], "x.png")], ["q", "Rice"]])).toBe("/players?q=Rice");
  });
});
