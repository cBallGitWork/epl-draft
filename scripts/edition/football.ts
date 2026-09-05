import {
  type Club,
  type FootballPlayer,
  type FootballSnapshot,
  type MatchReportEvent,
  type MatchReportSide,
  fetchPlFixture,
  fetchPlMatchStats,
  fetchPlRound,
  fetchPlTextstream,
  mapMatchEvents,
  mapRoundGoals,
  plFixtureCode,
  plMatchMetrics,
  plPlayerCodes,
} from "@epl/core";

// What actually happened in each match of the round, for the match report.
//
// **The column was a ledger because the brief was one.** It said in as many
// words *"you have each man's stat line and nothing else — you do not know the
// order anything happened"*, so a writer with no sequence could only enumerate:
// every sentence came out `name, number, owner`, and one filed headline set a
// MINUTE in a scoreline's grammar. This is the half that was missing.
//
// Script-side and not app-side on purpose. It costs about two requests per
// fixture, which is nothing for a nightly writer and would be a great deal on a
// page a phone refreshes every thirty seconds.

/** CM's Match Stats board, cut to the figures a REPORT can carry.
 *
 *  Five, from a provider that publishes about a hundred and seventy. A match
 *  report quotes a figure to make a point; a writer handed the lot writes a
 *  spreadsheet, which is the failure being fixed rather than one to repeat at
 *  higher resolution. `docs/providers/premier-league-api.md` has the rest. */
const FIGURES = {
  possession: "possession_percentage",
  shots: "total_scoring_att",
  onTarget: "ontarget_scoring_att",
  corners: "corner_taken",
  fouls: "fk_foul_lost",
} as const;

export interface MatchFootball {
  events: MatchReportEvent[];
  sides: readonly [MatchReportSide, MatchReportSide] | null;
}

/** Every played fixture of the round, by FPL fixture id.
 *
 *  Returns an empty map when their API cannot be read at all. That is not the
 *  swallow §2 forbids: the brief's instruction inverts on an empty timeline and
 *  tells the writer it has no sequence, so a silent provider costs the report
 *  its spine and never invents one. */
export async function roundFootball(
  gameweek: number,
  snapshot: FootballSnapshot,
  clubs: Map<number, Club>,
): Promise<Map<number, MatchFootball>> {
  const out = new Map<number, MatchFootball>();
  const round = await fetchPlRound(gameweek).catch(() => null);
  if (round === null) return out;

  const byCode = new Map(snapshot.fixtures.map((f) => [f.code, f]));
  const named = new Map(snapshot.players.map((p) => [p.code, p]));
  const optaToCode = new Map(
    snapshot.players.flatMap((p) => (p.optaCode === null ? [] : [[p.optaCode, p.code] as const])),
  );

  // The round's goals arrive in ONE read, with the minute and the assister —
  // which is the whole reason this is affordable. Mapped per fixture below,
  // where the player codes for that match are known: a round-wide call with an
  // empty code map, which is what stood here, resolves nobody and was assigned
  // to a variable nothing read.
  for (const fixture of round.content) {
    const code = plFixtureCode(fixture);
    const ours = code === null ? undefined : byCode.get(code);
    if (ours === undefined || fixture.status === "U") continue;

    const [detail, stats] = await Promise.all([
      fetchPlFixture(fixture.id).catch(() => null),
      fetchPlMatchStats(fixture.id).catch(() => null),
    ]);
    if (detail === null) continue;

    const codes = plPlayerCodes(detail, optaToCode);
    const name = (code: number | null): string | null =>
      code === null ? null : (named.get(code)?.name ?? null);

    // Goals from the round read (they carry the assister), cards and
    // substitutions from the commentary. Both are minute-stamped and both are
    // ordered by the same clock, so they interleave.
    const events = [
      ...mapRoundGoals([{ ...fixture, teamLists: detail.teamLists }], codes),
      ...mapMatchEvents(
        (await fetchPlTextstream(fixture.id).catch(() => null))?.events.content ?? [],
        code ?? 0,
        codes,
      ).filter((e) => e.kind === "yellow-card" || e.kind === "red-card" || e.kind === "substitution"),
    ]
      .sort((a, b) => a.seconds - b.seconds)
      .flatMap((e): MatchReportEvent[] => {
        const player = name(e.players[0] ?? null);
        // A man we could not place is a man we cannot write about. Dropped
        // rather than printed as a blank, which would read as an event with no
        // subject.
        return player === null
          ? []
          : [{ minute: e.minute, kind: e.kind, player, other: name(e.players[1] ?? null) }];
      });

    out.set(ours.id, { events, sides: sidesOf(fixture, stats, clubs, ours) });
  }
  return out;
}

function sidesOf(
  fixture: { teams: { team: { id: number } }[] },
  stats: Awaited<ReturnType<typeof fetchPlMatchStats>> | null,
  clubs: Map<number, Club>,
  ours: { homeClubId: number; awayClubId: number },
): readonly [MatchReportSide, MatchReportSide] | null {
  if (stats === null) return null;
  const sides = [ours.homeClubId, ours.awayClubId].map((clubId, i) => {
    const metric = plMatchMetrics(stats, fixture.teams[i]?.team.id ?? -1);
    const club = clubs.get(clubId)?.name ?? "—";
    // Null throughout when the provider had no stats for this side at all — as
    // against a metric worth nought, which `plMatchMetrics` already answers as 0
    // because the provider omits a zero rather than sending one.
    return metric === null
      ? { club, possession: null, shots: null, onTarget: null, corners: null, fouls: null }
      : {
          club,
          possession: metric(FIGURES.possession),
          shots: metric(FIGURES.shots),
          onTarget: metric(FIGURES.onTarget),
          corners: metric(FIGURES.corners),
          fouls: metric(FIGURES.fouls),
        };
  });
  return [sides[0], sides[1]] as const;
}
