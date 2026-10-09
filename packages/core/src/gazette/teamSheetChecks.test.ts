import { describe, expect, it } from "vitest";
import { NEWS_GAPS, unbackedFit } from "./teamSheetChecks";
import { banned } from "./banned";

// The Team Sheet of 9 Oct 2026, verbatim: clubs written up as who did not speak and what was not said.

describe("NEWS_GAPS", () => {
  it("catches every line that went to print about an absent manager or absent news", () => {
    const printed = [
      "William Saliba and Christos Tzolis stay sidelined, with no manager attached to the update.",
      "Nicolò Savona remains out, and no manager put his name to the news.",
      "Pedro Porro and the rest of the sidelined five gain no fresh word before the deadline.",
      "Jack Butland heads six men still unavailable, with no manager named on the returns.",
      "Abdul Fatawu is still the lone absentee, with nothing added.",
      "Unai Emery had one return to report and no change on the absentees.",
      "Nobel Mendy is back in contention for Hull City, and that is all that was said about him.",
      "No complaint was named and no manager was attached to the update, so whether he starts is left open.",
    ];
    for (const line of printed) expect(banned(line, NEWS_GAPS), line).not.toEqual([]);
  });

  it("lets a plain football fact through", () => {
    const plain = [
      "William Saliba and Christos Tzolis are out.",
      "Leon Goretzka is back from a knee injury.",
      "Pierre Sage welcomed three back, with Chadi Riad and Axel Disasi still missing.",
      "No injury concerns.",
    ];
    for (const line of plain) expect(banned(line, NEWS_GAPS), line).toEqual([]);
  });
});

describe("unbackedFit", () => {
  it("names a FIT man whose note is a bare complaint, which reads as if he still has it", () => {
    const rows = [{ club: "Arsenal", men: [
      { name: "Cristhian Mosquera", status: "FIT", note: "muscle" },
      { name: "Benjamin White", status: "FIT", note: "back from a groin injury" },
      { name: "Kenny Tete", status: "FIT", note: "" },
      { name: "Igor Jesus", status: "OUT", note: "calf" },
    ] }];
    expect(unbackedFit(rows)).toEqual(["Cristhian Mosquera"]);
  });

  it("reads nothing into a row that is not one", () => {
    expect(unbackedFit(undefined)).toEqual([]);
    expect(unbackedFit([null, { men: "x" }, { men: [null, { status: "FIT" }] }])).toEqual([]);
  });
});
