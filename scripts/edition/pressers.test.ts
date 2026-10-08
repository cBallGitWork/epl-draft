import { describe, expect, it } from "vitest";
import type { PresserLine, PresserQuote } from "@epl/core";
import { display, isNews } from "./pressers";
import { presserDays, presserEdition, withStillOut } from "./presserWeek";

// Every row is a real 26/27 player, read out of the FPL snapshot on 18 Sep 2026.
// The column prints these names in prose, so a wrong one is a wrong fact.
describe("display", () => {
  it("adds the first name FPL leaves off", () => {
    expect(display({ name: "Burn", fullName: "Dan Burn" })).toBe("Dan Burn");
    expect(display({ name: "Osula", fullName: "William Osula" })).toBe("William Osula");
  });

  it("keeps a compound surname whole", () => {
    expect(display({ name: "Van den Berg", fullName: "Sepp van den Berg" })).toBe("Sepp van den Berg");
    expect(display({ name: "Kesler-Hayden", fullName: "Kaine Kesler-Hayden" })).toBe("Kaine Kesler-Hayden");
  });

  it("drops the initial FPL uses to tell a squad apart", () => {
    expect(display({ name: "N.Gonzalez", fullName: "Nico González Iglesias" })).toBe("Nico González");
    expect(display({ name: "J.Ramsey", fullName: "Jacob Ramsey" })).toBe("Jacob Ramsey");
  });

  it("finds a surname buried in a longer full name", () => {
    expect(display({ name: "Caicedo", fullName: "Moisés Caicedo Corozo" })).toBe("Moisés Caicedo");
    expect(display({ name: "Savona", fullName: "Nicolò Savona" })).toBe("Nicolò Savona");
  });

  it("leaves a man who goes by one name alone", () => {
    expect(display({ name: "Joelinton", fullName: "Joelinton Cássio Apolinário de Lira" })).toBe("Joelinton");
    expect(display({ name: "Murillo", fullName: "Murillo Costa dos Santos" })).toBe("Murillo");
    expect(display({ name: "Jair Cunha", fullName: "Jair Paula da Cunha Filho" })).toBe("Jair Cunha");
  });

  it("takes the token after the match when the match is his first name", () => {
    expect(display({ name: "O.Dango", fullName: "Dango Ouattara" })).toBe("Dango Ouattara");
    // A suffix after the dot, which printed "Kroupi.Jr" in the Team Sheet of 8 Oct.
    expect(display({ name: "Kroupi.Jr", fullName: "Junior Kroupi" })).toBe("Junior Kroupi");
  });

  it("falls back to the web name when there is nothing to add", () => {
    expect(display({ name: "Sels", fullName: "" })).toBe("Sels");
    expect(display({ name: "Sels" })).toBe("Sels");
  });
});

describe("presserEdition", () => {
  // A round holds TWO conferences — Thursday's covers the clubs playing first,
  // Friday's the rest — and the desk's window is the ROUND's. Without this,
  // Friday's column carried all eighteen clubs and led on a Thursday man.
  const all = {
    lines: [
      { said: "2026-09-17T12:30:00.000Z", club: "Chelsea" },
      { said: "2026-09-18T08:00:00.000Z", club: "Arsenal" },
      { said: "2026-09-18T12:30:00.000Z", club: "Spurs" },
    ],
    // A real quote's shape (data/intel/pressers/26-27.json): `said` is the SPEAKER, `at` the conference.
    quotes: [
      {
        club: 3,
        text: "In form, in the opponent, in the relationship that we have within that unit, there are a lot of factors.",
        said: "Mikel Arteta",
        about: "Eberechi Eze on the left wing",
        at: "2026-09-18T08:00:00.000Z",
      },
    ],
    spoke: [{ at: "2026-09-17T12:30:00.000Z", club: "Chelsea" }],
  };

  it("carries one day's conferences and no others", () => {
    const friday = presserEdition("2026-09-18", all);
    expect(friday.lines.map((r) => r.club)).toEqual(["Arsenal", "Spurs"]);
    expect(friday.quotes).toHaveLength(1);
    expect(friday.spoke).toHaveLength(0);
  });

  it("narrows every member the same way", () => {
    const thursday = presserEdition("2026-09-17", all);
    expect(thursday.lines.map((r) => r.club)).toEqual(["Chelsea"]);
    expect(thursday.quotes).toHaveLength(0);
    expect(thursday.spoke).toHaveLength(1);
  });

  it("reads the day in London, not UTC", () => {
    // 23:30 London on the 17th is 22:30Z; a UTC key would file it a day early.
    const late = { lines: [{ said: "2026-09-17T23:30:00.000Z" }], quotes: [], spoke: [] };
    expect(presserEdition("2026-09-18", late).lines).toHaveLength(1);
  });

  it("files an undated quote on no day", () => {
    const quote: PresserQuote = { club: 3, said: "Mikel Arteta", text: "We will see." };
    expect(presserEdition("2026-09-18", { lines: [], quotes: [quote], spoke: [] }).quotes).toHaveLength(0);
  });

  it("drops a row whose instant cannot be read", () => {
    expect(presserEdition("2026-09-18", { lines: [{ said: "nope" }], quotes: [], spoke: [] }).lines).toHaveLength(0);
  });
});

describe("presserDays", () => {
  it("names each London day once, in order", () => {
    const line = (said: string) => ({ said }) as PresserLine;
    // 23:30Z on the 8th is half past midnight on the 9th in London.
    const lines = [line("2026-10-09T12:30:00.000Z"), line("2026-10-08T23:30:00.000Z"), line("2026-10-08T13:30:00.000Z")];
    expect(presserDays(lines)).toEqual(["2026-10-08", "2026-10-09"]);
  });
});

describe("isNews", () => {
  const said = "2026-10-08T12:30:00.000Z";

  it("makes a man declared fit news, however old his FPL note", () => {
    // Harry Wilson, back in training on 8 Oct under a note from 18 Sep, was printed as still out.
    expect(isNews("available", "2026-09-18T13:30:09.626Z", said)).toBe(true);
  });

  it("leaves an old absence standing, and a fresh one news", () => {
    expect(isNews("injury_scare", "2026-08-30T16:00:08.564Z", said)).toBe(false);
    expect(isNews("injury_scare", "2026-10-08T14:00:11.803Z", said)).toBe(true);
  });
});

describe("withStillOut", () => {
  // Leeds on 8 Oct: James is news, Rodon and Joseph are standing absences, one held and one not.
  const line = (playerName: string, ownerName: string | null, fresh: boolean) =>
    ({ playerName, ownerName, fresh, club: 2 }) as PresserLine;
  const lines = [line("Daniel James", null, true), line("Joe Rodon", "Craig", false), line("Mateo Joseph", null, false)];

  it("lists the club's standing absences with who holds each, in place of the column's", () => {
    const rows = [{ club: "Leeds United", code: 2, men: [{ name: "Daniel James" }], alsoOut: ["Daniel James"], stillOut: [{ name: "Pope" }] }];
    expect(withStillOut(rows, lines)).toEqual([
      {
        club: "Leeds United",
        code: 2,
        men: [{ name: "Daniel James" }],
        stillOut: [{ name: "Joe Rodon", owner: "Craig" }, { name: "Mateo Joseph" }],
      },
    ]);
  });

  it("leaves off a man the column bulleted, and a row whose code was refused", () => {
    const bulleted = withStillOut([{ club: "Leeds United", code: 2, men: [{ name: "Joe Rodon" }] }], lines) as { stillOut: unknown }[];
    expect(bulleted[0].stillOut).toEqual([{ name: "Mateo Joseph" }]);
    expect(withStillOut([{ club: "Leeds United", code: null }], lines)).toEqual([{ club: "Leeds United", code: null }]);
  });
});
