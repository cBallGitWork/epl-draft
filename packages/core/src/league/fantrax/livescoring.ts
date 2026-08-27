import type { LivePlayerPoints, LiveSquadPoints, LiveTeamScore } from "../types";

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
  /** True when `delta` is set: `allTeamsStats` would then be a partial, and a
   *  player missing from it would read as one who has not played rather than one
   *  Fantrax declined to resend. Mirrored and never read, because it has
   *  answered false on every payload seen — a mapper written against a shape we
   *  have not observed would be a guess. `refresh` is its companion. */
  delta?: boolean;
  refresh?: boolean;
  /** Fantrax's own "the round is over". Not read: the football layer answers the
   *  same question from FPL, which is the provider that actually knows, and a
   *  second opinion we would have to arbitrate is worse than one we would not. */
  allEventsFinished?: boolean;
  statsPerTeam?: {
    allTeamsStats?: Record<string, RawTeamSections | undefined>;
  };
}

/** `BENCH` is only ever present for an authenticated caller, and only `ACTIVE`
 *  scores, so the public view is the whole answer for a scoreboard. */
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
   *  projection are omitted rather than zeroed. Not mapped: a projection is a
   *  different claim from a score and nothing shows one yet. */
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
   *  pre-game guess. The two were identical until football existed. Not read —
   *  nothing shows a projection. */
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
 *  ACTIVE only, on the same rule as `mapLiveScores`: `BENCH` arrives for an
 *  authenticated caller and we are never that one, and only active players
 *  score. A man with no entry is left out rather than zeroed — Fantrax adds him
 *  when he plays, so absence here means no football behind him, and a nought
 *  would be a claim about a man who has not kicked a ball.
 *
 *  Categories that contributed nothing are dropped, as `breakdownOf` drops them
 *  from the season table: a row reading zero is not a reason he is on his total,
 *  and keeping thirteen of them per player is most of the payload. */
export function mapLivePlayerPoints(raw: RawLiveScoring): LiveSquadPoints[] {
  const teams = raw.statsPerTeam?.allTeamsStats ?? {};

  return Object.entries(teams).flatMap(([teamId, sections]) => {
    const active = sections?.ACTIVE;
    if (!active) return [];

    const players: LivePlayerPoints[] = [];
    for (const [fantraxId, stats] of Object.entries(active.statsMap ?? {})) {
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
          return [{ category, value: typeof row.av === "number" ? row.av : null, points: row.fpts }];
        }),
      });
    }
    return [{ teamId, players }];
  });
}
