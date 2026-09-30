import type { RawPlFixture, RawPlSquadPlayer } from "./raw";

// Who was named for one match, and the shape they were named in.
//
// **Split out of `map.ts` on 10 Sep 2026**, which had reached 332 lines against
// CODE_RULES §4's hard 300 and was three jobs in a trench coat: the round's
// goals, Opta's commentary, and this. The seam is real rather than arithmetic —
// nothing here reads an event and nothing there reads a sheet — and it puts the
// team sheet beside `sheetEvents.ts`, which is what marks the men on it.

/** Premier League player id → FPL player `code`, for the two squads in a match.
 *
 *  The whole join, in one function. `optaToCode` is FPL's own `opta_code` →
 *  `code`, which a caller builds from a bootstrap it already holds.
 *
 *  **Harvested from the team sheets and not from the `/players` collection.**
 *  That collection is the obvious source and it is incomplete: counted against
 *  every player named in the 2,215 events of gameweeks 1-3, it misses 20 of the
 *  360 who appear, 14 of them in a goal, a card or a substitution — one a
 *  scorer. All twenty are on a team sheet, and not one of the twenty was an id
 *  mismatch; the collection simply lags squad registration. */
export function plPlayerCodes(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): Map<number, number> {
  const codes = new Map<number, number>();
  for (const list of fixture.teamLists ?? []) {
    // A side nobody has named yet is a null ENTRY in a two-long array, not an
    // absent array — see `RawPlFixture.teamLists`. This read `list.lineup`
    // straight and threw on every unstarted fixture, which the app's own
    // try/catch was quietly absorbing as "no sheets".
    if (list === null || list === undefined) continue;
    for (const player of [...list.lineup, ...list.substitutes]) {
      const opta = player.altIds?.opta;
      const code = opta === undefined ? undefined : optaToCode.get(opta);
      if (code !== undefined) codes.set(player.id, code);
    }
  }
  return codes;
}

/** A man's FPL code from his Premier League id, or null when the feed names nobody or the bridge cannot place him. */
export function codeOf(codes: ReadonlyMap<number, number>, id: number | undefined): number | null {
  return id === undefined ? null : (codes.get(id) ?? null);
}

/** One man as a team sheet names him, joined to FPL where the bridge can. */
export interface PlSquadMan {
  /** FPL's season-stable player `code`, or null when the bridge could not place
   *  him. Null is a real answer and not a failure to try: the Premier League
   *  registers a squad before FPL lists everyone in it, which is the same lag
   *  `scripts/pl-bridge.ts` exists for. He keeps his name either way. */
  code: number | null;
  name: string;
  /** The number on his back in THIS match. Absent for a man the payload gave
   *  none — counted rather than assumed, and drawn as an empty block. */
  shirt: number | null;
  /** The position he was NAMED in for this match — `G`, `D`, `M` or `F`, the
   *  Premier League's own letters. Null for a man the payload gave none.
   *
   *  **This is a FOOTBALL fact and not a league one**, which is the distinction
   *  CLAUDE.md draws when it says position left the football layer. What left
   *  was FPL's `element_type`: a position in a game whose rules are somebody's
   *  product, which is why it belongs to the league adapter. This is the
   *  Premier League saying where a man played on an afternoon, which is as
   *  much a fact about the match as his shirt number.
   *
   *  Counted 11 Sep 2026 on the recorded fixture: **40 of 40** men, starters and
   *  bench alike, and four distinct values. */
  position: string | null;
  captain: boolean;
}

/** A side's sheet: who started, who sat, and the shape. */
export interface PlTeamSheet {
  /** The Premier League's own team id, which is what `teamLists` is keyed on. */
  teamId: number;
  lineup: PlSquadMan[];
  substitutes: PlSquadMan[];
  /** `"4-2-3-1"`, or null for a fixture whose sheet carries no formation. */
  formation: string | null;
  /** The same shape DRAWN rather than described: one row per line, keeper first,
   *  so `4-2-3-1` is five rows of 1, 4, 2, 3, 1. Null whenever `formation` is.
   *
   *  **The provider gives it as rows of ids and this resolves them to men**, so a
   *  caller can put a name on a pitch without holding a second lookup. A row is
   *  only as long as the ids that resolved: a man on the grid who is somehow not
   *  in `lineup` is dropped rather than drawn as a gap, because a pitch with a
   *  hole in it is a worse answer than a pitch with ten men.
   *
   *  Counted 10 Sep 2026 across the 30 completed fixtures of gameweeks 1-3: both
   *  sides carry a formation on 30/30, and every grid resolved to eleven. */
  shape: PlSquadMan[][] | null;
}

/** Both sides' team sheets, home first.
 *
 *  **The only source of an unused substitute anywhere in this app.** FPL's
 *  per-fixture stats carry a row for a man who accrued something and nothing for
 *  a man who sat, so a ratings board built from them is eleven names and a bench
 *  that does not exist. The Premier League's own fixture detail carries both
 *  lists, and this is the read `client.ts` already had and nothing drew.
 *
 *  **Home first, off `teams` rather than off `teamLists`.** The two arrays are
 *  independently ordered and only the first says which side is at home; matching
 *  them on `teamId` is what stops a sheet being drawn under the wrong crest.
 *  A fixture with no sheets at all — one nobody has named a side for yet —
 *  answers null rather than two empty ones, so a caller can tell "not published"
 *  from "eleven men and no bench". */
export function plTeamSheets(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): { home: PlTeamSheet; away: PlTeamSheet } | null {
  // **Not `length === 0`.** An unnamed fixture answers `[null, null]`, which is
  // two entries and no sheets — so the length test passed and `entry.teamId`
  // threw one line later. Counted 5 Sep 2026: every fixture a week out answers
  // exactly that. The docblock above has always said null means "not published";
  // this is the shape that actually says it.
  const lists = (fixture.teamLists ?? []).filter((entry) => entry !== null && entry !== undefined);
  if (lists.length === 0) return null;

  const sheetFor = (teamId: number): PlTeamSheet | null => {
    const list = lists.find((entry) => entry.teamId === teamId);
    if (list === undefined) return null;

    // Built from the SAME objects the lineup is, so a man drawn on the pitch and
    // the same man in the list are one value rather than two that could drift.
    const byId = new Map(list.lineup.map((man) => [man.id, squadMan(man, optaToCode)]));
    const grid = list.formation?.players;

    return {
      teamId,
      lineup: [...byId.values()],
      substitutes: list.substitutes.map((man) => squadMan(man, optaToCode)),
      formation: list.formation?.label ?? null,
      shape:
        grid === undefined
          ? null
          : grid.map((line) =>
              line.flatMap((id) => {
                const man = byId.get(id);
                return man === undefined ? [] : [man];
              }),
            ),
    };
  };

  const [home, away] = (fixture.teams ?? []).map((side) => sheetFor(side.team.id));
  return home == null || away == null ? null : { home, away };
}

function squadMan(man: RawPlSquadPlayer, optaToCode: Map<string, number>): PlSquadMan {
  const opta = man.altIds?.opta;
  return {
    code: (opta === undefined ? undefined : optaToCode.get(opta)) ?? null,
    name: man.name.display,
    shirt: man.matchShirtNumber ?? null,
    position: man.matchPosition ?? null,
    captain: man.captain === true,
  };
}
