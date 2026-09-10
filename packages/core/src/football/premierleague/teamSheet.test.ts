import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import recordedStreams from "../__fixtures__/plTextstream.json";
import type { RawPlFixture, RawPlTextstream } from "./raw";
import { plPlayerCodes, plTeamSheets } from "./teamSheet";

// Recorded from the Premier League's own API on 4 Sep 2026, never fetched
// (CODE_RULES §6). Liverpool 2-2 Nottingham Forest, gameweek 2 — both sides
// named, both carrying a formation, and nine substitutes a side.
const DETAIL = recordedFixture as unknown as RawPlFixture;
/** The textstream's own fixture header, which carries no team lists at all — a
 *  different absence from `[null, null]` and worth keeping both. */
const [PLAYED] = recordedStreams as unknown as RawPlTextstream[];

/** FPL's `opta_code` → `code`, which the app builds from a bootstrap it holds.
 *  Every player on both sheets, coded as his own id plus a million so a wrong
 *  join is visible rather than coincidental. */
const optaToCode = new Map(
  [...(DETAIL.teamLists ?? [])].flatMap((list) =>
    list === null
      ? []
      : [...list.lineup, ...list.substitutes].flatMap((p) =>
          p.altIds ? [[p.altIds.opta, p.id + 1_000_000] as [string, number]] : [],
        ),
  ),
);

const codes = plPlayerCodes(DETAIL, optaToCode);

describe("plPlayerCodes", () => {
  it("covers both squads, starters and bench", () => {
    expect(codes.size).toBe(40);
  });

  it("keys on the id the event feed speaks in, not on the opta string", () => {
    // 21737 is Alexander Isak in the provider's own numbering, and it is what
    // `playerIds` carries. The opta code is the join and never the key.
    expect(codes.get(21_737)).toBe(21_737 + 1_000_000);
  });

  it("drops a player FPL has no code for rather than inventing one", () => {
    expect(plPlayerCodes(DETAIL, new Map()).size).toBe(0);
  });
});

describe("plTeamSheets", () => {
  const sheets = plTeamSheets(DETAIL, optaToCode);

  it("gives both sides their eleven, their bench and their shape", () => {
    // The whole point: FPL's per-fixture stats carry a row for a man who
    // accrued something and NOTHING for one who sat, so a ratings board built
    // from them has no bench at all. This is the only source of an unused
    // substitute anywhere in the app.
    expect(sheets?.home.lineup).toHaveLength(11);
    expect(sheets?.home.substitutes).toHaveLength(9);
    expect(sheets?.away.lineup).toHaveLength(11);
    expect(sheets?.away.substitutes).toHaveLength(9);
    expect(sheets?.home.formation).toBe("4-2-3-1");
    expect(sheets?.away.formation).toBe("3-4-2-1");
  });

  it("puts the HOME side first, off `teams` rather than off `teamLists`", () => {
    // The two arrays are independently ordered and only the first says which
    // side is at home. Matching them on `teamId` is what stops a sheet being
    // drawn under the wrong crest — Liverpool are at home in this one.
    expect(sheets?.home.teamId).toBe(10);
    expect(sheets?.away.teamId).toBe(15);
  });

  it("carries the shirt number the payload gave and the captain's armband", () => {
    const captains = [...(sheets?.home.lineup ?? []), ...(sheets?.away.lineup ?? [])].filter(
      (man) => man.captain,
    );
    expect(captains).toHaveLength(2);
    expect(sheets?.home.lineup.every((man) => man.shirt !== null)).toBe(true);
  });

  it("keeps a man FPL has no code for, with his name and a null code", () => {
    // A doubt about our bridge is not a doubt about whether he sat on the bench.
    // The Premier League registers a squad before FPL lists everyone in it,
    // which is the lag `scripts/pl-bridge.ts` exists for.
    const blind = plTeamSheets(DETAIL, new Map());
    expect(blind?.home.substitutes).toHaveLength(9);
    expect(blind?.home.substitutes.every((man) => man.code === null)).toBe(true);
    expect(blind?.home.substitutes[0].name.length).toBeGreaterThan(0);
  });

  it("resolves the formation grid to men, keeper first", () => {
    // `RawPlFormation.players` is rows of provider ids; a caller wants men. The
    // row lengths ARE the formation read left to right with the keeper in front,
    // which is the check that catches a grid transposed or flattened.
    const sheet = plTeamSheets(DETAIL, optaToCode);
    const shape = sheet?.home.shape;
    expect(shape?.map((line) => line.length)).toEqual([
      1,
      ...(sheet?.home.formation ?? "").split("-").map(Number),
    ]);
    expect(shape?.flat()).toHaveLength(11);
    expect(shape?.[0][0].name.length).toBeGreaterThan(0);
  });

  it("draws the same man object on the pitch as in the lineup", () => {
    // One value rather than two that could drift — a name shortened in the list
    // and not on the pitch is the bug this forecloses.
    const sheet = plTeamSheets(DETAIL, optaToCode);
    for (const man of sheet?.home.shape?.flat() ?? []) {
      expect(sheet?.home.lineup).toContain(man);
    }
  });

  it("has no shape for a sheet carrying no formation", () => {
    // Null rather than an empty grid: a pitch with nobody on it is a drawing of
    // a fact we do not have.
    const bare = {
      ...DETAIL,
      teamLists: (DETAIL.teamLists ?? []).map((list) =>
        list === null ? null : { ...list, formation: undefined },
      ),
    } as unknown as RawPlFixture;
    expect(plTeamSheets(bare, optaToCode)?.home.shape).toBeNull();
    expect(plTeamSheets(bare, optaToCode)?.home.lineup).toHaveLength(11);
  });

  it("answers null for a fixture nobody has named a side for", () => {
    // Told apart from "eleven men and no bench", which is a different fact and
    // one a caller draws differently.
    expect(plTeamSheets({ ...DETAIL, teamLists: [] }, optaToCode)).toBeNull();
    expect(plTeamSheets(PLAYED.fixture, optaToCode)).toBeNull();
  });
});

describe("an unnamed fixture", () => {
  // **`[null, null]`, and it is the shape every match more than an hour or two
  // out answers with** — counted 5 Sep 2026 across GW4, seven days off: all ten
  // fixtures. It is two entries and no sheets, so a `length === 0` test passes
  // it through and the next line reads `.teamId` off null.
  const unnamed = {
    ...DETAIL,
    teamLists: [null, null],
  } as unknown as RawPlFixture;

  it("has no sheets rather than throwing", () => {
    expect(plTeamSheets(unnamed, optaToCode)).toBeNull();
  });

  it("codes nobody rather than throwing", () => {
    expect(plPlayerCodes(unnamed, optaToCode).size).toBe(0);
  });

  // A half-published fixture is not a shape the feed has been seen to send, and
  // the answer for it is the same one: a sheet for one side only is not a sheet.
  it("refuses a fixture named on one side only", () => {
    const half = {
      ...DETAIL,
      teamLists: [(DETAIL.teamLists ?? [])[0], null],
    } as unknown as RawPlFixture;
    expect(plTeamSheets(half, optaToCode)).toBeNull();
  });
});
