import type { LivePlayerPoints, LiveSquadPoints, LiveTeamScore, PlayerProjection, SquadProjection, TeamProjection } from "../points";

// Fantrax's live-scoring page, which answers without a cookie and hands back
// typed numbers rather than the formatted strings the rest of their surface is
// made of (PLATFORM_NOTES, 13 Aug). One call carries every team in the league:
// their own page filters to a matchup in the browser, and passing `matchupId`
// changes nothing, so we ask once and read all of it.
//
// These are Fantrax's points, not ours. We compute no scoring — the real
// league scores five categories FPL does not even publish — so what this reads
// is the score, not an estimate of it.

/** The wire, mirrored including the parts we decline to read. */
export interface RawLiveScoring {
  /** Fantrax's own "the round is over". Not read: the football layer answers the
   *  same question from FPL, which is the provider that actually knows, and a
   *  second opinion we would have to arbitrate is worse than one we would not. */
  allEventsFinished?: boolean;
  statsPerTeam?: {
    allTeamsStats?: Record<string, RawTeamSections | undefined>;
    /** True when `allTeamsStats` is a PARTIAL: a player missing from it would
     *  then read as one who has not played rather than one Fantrax declined to
     *  resend. Mirrored and never read, because it has answered false on every
     *  payload seen and a mapper written against a shape we have not observed
     *  would be a guess. `refresh` is its companion.
     *
     *  Inside `statsPerTeam` and not at the root, which is where they actually
     *  are on the wire — checked against the payload rather than assumed, after
     *  this declaration and the recorded fixture disagreed about it. */
    delta?: boolean;
    refresh?: boolean;
  };
}

/** Only `ACTIVE` scores. `BENCH` arrives only when asked with `playerViewType: "2"`,
 *  priced the same way and counted in no team's total. */
export interface RawTeamSections {
  ACTIVE?: RawTeamSection;
  BENCH?: RawTeamSection;
}

export interface RawTeamSection {
  totalFpts?: number;
  /** Fraction of each player's fixture still to play, keyed by our `fantraxId`.
   *  1 before kickoff. */
  remainingEventPercent?: Record<string, number | undefined>;
  /** Fantrax's own per-player projection for the period. Players with no
   *  projection are omitted rather than zeroed.
   *
   *  Read by `mapProjectedTotals`, and it is the ONLY thing worth reading before
   *  a round: `totalFpts` is a genuine nought until a ball is kicked, so a
   *  preview built on it hands its reader nought against nought for every tie
   *  while calling them projections. Keyed and group-subtotalled exactly as
   *  `statsMap` is. */
  projectedTotalsMap?: Record<string, number | undefined>;
  /** Five integers, decoded 22 Aug 2026 across a whole matchday and left
   *  unmodelled anyway:
   *
   *  `[0]` players who appeared and whose match is over · `[1]` players in a
   *  match in progress · `[2]` players still to come · `[3]` = `[0] × 90` ·
   *  `[4]` = `[2] × 90` plus the real minutes left in the matches under way.
   *
   *  `[1]` was verified against the count of `gameStatusMap` entries in state 2,
   *  and `[3]` is nominal — it read 180 for two men who played 67 and 75.
   *
   *  Still not read, because `toPlay` comes from `remainingEventPercent`, which
   *  says what it means without a decoding note. Written down because `[0]+[1]+[2]`
   *  falls short of eleven by exactly the number of men whose match ended without
   *  them, which is a fact worth having if anything ever wants it. */
  playerGameInfo?: number[];
  /** `"{OPP}~{kickoffEpochMs}|{gameId}|{state}"` before kickoff, and
   *  `"COV 0 @ ARS 3 F|{gameId}|{state}"` once it is under way. State 1 upcoming,
   *  2 in progress, 3 finished. Not read: this is football wearing league
   *  clothes, and the football layer already carries fixtures and scores from
   *  the provider whose job they are. */
  gameStatusMap?: Record<string, string | undefined>;
  /** Per player, his fantasy total for the period (`object1`) and the
   *  per-category rows behind it (`object2`), priced at the ROSTER SLOT.
   *
   *  The only slot-priced per-player number Fantrax publishes, and therefore the
   *  only one that agrees with the total on their own scoreboard: their stat
   *  tables price a man at his `defaultPosId` instead, which is how a board came
   *  to show a header of 16 over an eleven summing to 14.
   *
   *  **Keyed by our `fantraxId`, and empty until a man has played** — eight
   *  entries for an eleven, on a round where three of them did not appear. So a
   *  missing key is a man with no football behind him, never a man on nought.
   *
   *  **Not every key is a player.** `_5010` and `_5020` are the outfield and
   *  goalie group subtotals — the same group ids `scoringCategorySettings` uses —
   *  and the two of them sum to `totalFpts` exactly, as the men do. Read as
   *  players they would be two phantoms, one of them carrying most of the team's
   *  score. */
  statsMap?: Record<string, RawPlayerStats | undefined>;
  /** Empty on every section seen so far, including a full live matchday. */
  statsMap2?: Record<string, unknown | undefined>;
  /** Fantrax's projection updated for what has already happened: for a man whose
   *  match is done it is his actual score, where `projectedTotalsMap` stays the
   *  pre-game guess. The two were identical until football existed.
   *
   *  Deliberately still not read. The preview is written before a ball is kicked
   *  and is judged on what it called from there, so the pre-game guess is the
   *  honest input; this one would quietly improve the column's odds every hour
   *  it was late. */
  calculatedProjectedTotalsMap?: Record<string, number | undefined>;
  projectedTotalsMap2?: Record<string, number | undefined>;
  totalFpts2?: number;
}

/** One player's period score and the categories behind it. */
export interface RawPlayerStats {
  /** His total for the period. */
  object1?: number;
  object2?: RawCategoryStat[];
}

export interface RawCategoryStat {
  /** `"{groupId}#{categoryId}#{positionId}"`.
   *
   *  **The position segment is always `-1` here**, because this identifies a
   *  category rather than prices one — the pricing has already been applied.
   *  `getLeagueInfo` lists the same categories under the positions it prices
   *  them for (`701`/`702`/`703`), and outfield Goals and Clean Sheets have no
   *  `-1` row at all in the rehearsal league. Anything matching these ids to
   *  their names must drop the segment, or it silently loses exactly the
   *  categories worth reading. */
  scipId?: string;
  /** The value as Fantrax renders it. `av` is the same thing as a number, and is
   *  what anything computing reads. */
  sv?: string;
  av?: number;
  fpts?: number;
}

export function mapLiveScores(raw: RawLiveScoring): LiveTeamScore[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const active = sections?.ACTIVE;
    if (!active) return [];
    return [
      {
        teamId,
        // Absence stays absence. A team Fantrax has no total for is not a team
        // on nought, and a scoreboard saying nought would be a confident lie.
        points: typeof active.totalFpts === "number" ? active.totalFpts : null,
        toPlay: countToPlay(active.remainingEventPercent),
      },
    ];
  });
}

/** How many of the eleven still have football to come.
 *
 *  Counted from the players Fantrax lists rather than from a roster size: before
 *  a period opens we are not allowed to know who is in the eleven, and this
 *  number is publishable either way because it names nobody. */
function countToPlay(remaining: Record<string, number | undefined> | undefined): number | null {
  if (!remaining) return null;
  const values = Object.values(remaining).filter((value) => typeof value === "number");
  if (values.length === 0) return null;
  return values.filter((value) => value > 0).length;
}

/** Fantrax's own projected total per team, for a round nobody has played.
 *
 *  Summed from the per-player projections rather than read off a team field,
 *  because there is no team field: `totalFpts` is what a squad has ACTUALLY
 *  scored and reads a truthful nought all week. A preview built on it says
 *  nought against nought for every tie.
 *
 *  ACTIVE only and group subtotals skipped, on the same two rules
 *  `mapLivePlayerPoints` follows — `_5010` and `_5020` are the outfield and
 *  goalie groups, and counting them would roughly double every projection.
 *
 *  A team Fantrax projects nothing for is null, never nought: "they have not
 *  guessed" and "they guess he scores nothing" are different claims, and the
 *  scoreline rule already refuses to let a dash beat anybody. */
export function mapProjectedTotals(raw: RawLiveScoring): TeamProjection[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const projected = sections?.ACTIVE?.projectedTotalsMap;
    if (!projected) return [{ teamId, points: null }];

    let total = 0;
    let any = false;
    for (const [fantraxId, points] of Object.entries(projected)) {
      if (fantraxId.startsWith(GROUP_TOTAL) || typeof points !== "number") continue;
      total += points;
      any = true;
    }
    // Rounded to the tenth: these are sums of Fantrax's own decimals, and the
    // binary floating point of eleven of them is not a number anybody would
    // print.
    return [{ teamId, points: any ? Math.round(total * 10) / 10 : null }];
  });
}

/** Fantrax's own guess at each player, out of the map the totals above are
 *  summed from.
 *
 *  The same payload read a second time rather than a second request, and the
 *  same two rules: ACTIVE only, and `_5010` / `_5020` skipped because they are
 *  the outfield and goalie group subtotals rather than men.
 *
 *  **It is never a score and must never be printed as one.** `FPts` is Fantrax's
 *  word for what a player HAS scored; this is what they think he will, and the
 *  two sit one column apart on their own site. Anything showing this says whose
 *  guess it is (conventions.md).
 *
 *  A man they have no guess for is left out rather than zeroed. And everyone in
 *  the list is in his manager's eleven, because that is the only section Fantrax
 *  projects — so printing one of these is stating a lineup, and the gate that
 *  governs that belongs to the caller who knows who is asking. */
export function mapProjectedPlayerPoints(raw: RawLiveScoring): SquadProjection[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const projected = sections?.ACTIVE?.projectedTotalsMap;
    if (!projected) return [];

    const players: PlayerProjection[] = [];
    for (const [fantraxId, points] of Object.entries(projected)) {
      if (fantraxId.startsWith(GROUP_TOTAL) || typeof points !== "number") continue;
      players.push({ fantraxId, points });
    }
    return [{ teamId, players }];
  });
}

/** What marks a `statsMap` key as a group subtotal rather than a player. */
const GROUP_TOTAL = "_";

/** Fantrax's own key with the position segment dropped: `"5010#6090#-1"` becomes
 *  `"5010#6090"`. Null for a key that is not one of theirs. */
function categoryOf(scipId: string | undefined): string | null {
  if (typeof scipId !== "string") return null;
  const parts = scipId.split("#");
  return parts.length < 2 || parts[0] === "" || parts[1] === "" ? null : `${parts[0]}#${parts[1]}`;
}

/** Every player Fantrax has priced this period, by team, at his roster slot.
 *
 *  ACTIVE only, on the same rule as `mapLiveScores`: only active players score.
 *  A man with no entry is left out rather than zeroed, and a nought would be a
 *  claim about a man who may not have kicked a ball.
 *
 *  **Absence has two causes and a caller must not collapse them.** He is in the
 *  eleven and has not played, or he is a reserve and this table never names him.
 *  Only the roster knows which, so anything joining this map against all fifteen
 *  has to say so itself.
 *
 *  Categories that contributed nothing are dropped, as `breakdownOf` drops them
 *  from the season table: a row reading zero is not a reason he is on his total,
 *  and keeping thirteen of them per player is most of the payload.
 *
 *  **`sv` travels with the points**, which is the one thing a breakdown could
 *  not say before: "Minutes Played +2" is a price with the thing it priced left
 *  out, and 90 minutes is what earned it. */
export function mapLivePlayerPoints(raw: RawLiveScoring): LiveSquadPoints[] {
  return sectionPoints(raw, "ACTIVE");
}

/** The reserves Fantrax priced this period, which count in nobody's total. */
export function mapBenchPlayerPoints(raw: RawLiveScoring): LiveSquadPoints[] {
  return sectionPoints(raw, "BENCH");
}

function sectionPoints(raw: RawLiveScoring, which: keyof RawTeamSections): LiveSquadPoints[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const section = sections?.[which];
    if (!section) return [];

    const players: LivePlayerPoints[] = [];
    for (const [fantraxId, stats] of Object.entries(section.statsMap ?? {})) {
      // `_{groupId}` is a group subtotal and not a man. Verified across four
      // sections: the real players sum to `totalFpts`, and so do these two, so
      // keeping them would count every team twice.
      if (fantraxId.startsWith(GROUP_TOTAL)) continue;
      // A nought Fantrax stated is a nought; a total it withheld is not one.
      if (typeof stats?.object1 !== "number") continue;
      players.push({
        fantraxId,
        points: stats.object1,
        categories: (stats.object2 ?? []).flatMap((row) => {
          const category = categoryOf(row.scipId);
          if (category === null || typeof row.fpts !== "number" || row.fpts === 0) return [];
          // `sv` and not `av`: this is read back to a person, and it is the
          // string Fantrax already chose to render the count with.
          return [{ category, points: row.fpts, value: typeof row.sv === "string" ? row.sv : null }];
        }),
      });
    }
    return [{ teamId, players }];
  });
}
