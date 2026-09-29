import {
  FANTRAX_LEAGUE_ID,
  categoryPoints,
  datedKickoffs,
  debuts,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLiveScoringDay,
  fetchSeasonResults,
  fetchTeamRosterInfo,
  getFootballSnapshot,
  londonDayOf,
  mapBenchOrder,
  mapBenchPlayerPoints,
  mapFixtures,
  mapLeagueInfo,
  mapLivePlayerPoints,
  mapLiveScores,
  mapSeasonResults,
  matchupState,
  periodGameweeks,
  periodPairings,
  projectionIntel,
  seasonForm,
  sheetOf,
  standing,
  strengthIntel,
  strengthTable,
  type Cutoff,
  type DraftMan,
  type DraftSide,
  type IntelProjections,
  type IntelStrength,
  type LivePlayerPoints,
  type MatchupContext,
  type PeriodResult,
  type Sheet,
  type SheetMan,
} from "@epl/core";
import { INTEL_SEASON, readIntel } from "../intel";
import { gatherRoundFacts } from "./facts";
import { earlierSheets } from "./sheets";
import { minimums } from "./rosterMinimums";

// The draft match-up desk's reads for one gameweek, turned into each match-up's facts at both cut-offs: points by London
// day and minutes from Fantrax, the bench order, matches played and left from FPL's fixtures, the table and runs, the
// last meeting, the next opponent in strength words, and a projection that orders and never prints.

export interface DraftDesk {
  gameweek: number;
  period: number;
  days: string[];
  cutoffs: Map<Cutoff, MatchupContext[]>;
  notes: string[];
}

const SLOTS = ["G", "D", "M", "F"];

export async function draftDesk(gameweek: number): Promise<DraftDesk> {
  const [snapshot, info, season] = await Promise.all([
    getFootballSnapshot(gameweek),
    fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo),
    fetchFixtures().then(mapFixtures),
  ]);
  const round = periodGameweeks(
    info.scoringPeriods,
    datedKickoffs(season),
  ).find((p) => p.gameweeks.includes(gameweek));
  if (round === undefined)
    throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  const period = round.period;
  const [facts, history, rawResults] = await Promise.all([
    gatherRoundFacts(info, snapshot, period),
    earlierSheets(info, snapshot, period),
    fetchSeasonResults(FANTRAX_LEAGUE_ID).catch(() => null),
  ]);
  const results = rawResults === null ? [] : mapSeasonResults(rawResults);
  const form = seasonForm(facts.table, info.matchups, results);

  const fixtures = season.filter(
    (f) => f.gameweek === gameweek && f.kickoff !== null,
  );
  const days = [
    ...new Set(fixtures.map((f) => londonDayOf(f.kickoff!)!)),
  ].sort();
  const saturday =
    days.find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6) ?? days[0];
  const reads = await Promise.all(
    days.map(async (date) => ({
      date,
      raw: await fetchLiveScoringDay(FANTRAX_LEAGUE_ID, period, date),
    })),
  );
  const orders = new Map(
    await Promise.all(
      facts.teams.map(
        async (t) =>
          [
            t.teamId,
            mapBenchOrder(
              await fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, t.teamId, period),
            ),
          ] as const,
      ),
    ),
  );

  const rules = info.scoring;
  const flat = (category: string, slot: string) =>
    rules === null ? 0 : (categoryPoints(rules, category, slot) ?? 0);
  const idsOf = (match: (code: string, name: string) => boolean) =>
    new Set(
      Object.entries(info.scoringCategories)
        .filter(([, c]) => match(c.code, c.name))
        .map(([id]) => id),
    );
  const minutesCategories = idsOf((code) => code === "Min");
  // Tiered rules (DefCon, saves) are not spelt out in getLeagueInfo, so they are what Fantrax most often paid this round.
  const slotOf = new Map(
    facts.teams.flatMap((t) => {
      const s = sheetOf(t);
      return [...s.starters, ...s.bench].map(
        (m) => [m.fantraxId, m.slot] as const,
      );
    }),
  );
  const raws = reads.map((r) => r.raw);
  const keeper = rules?.goaliePosition ?? null;
  const worth = {
    appearance: appearance(raws, minutesCategories),
    returns: Object.fromEntries(
      SLOTS.map((slot) => [
        slot,
        (slot === keeper
          ? [
              { kind: "clean sheet" as const, worth: flat("CS", slot) },
              {
                kind: "saves" as const,
                worth: commonPaid(
                  raws,
                  idsOf((code) => code === "Sv"),
                  slot,
                  slotOf,
                ),
              },
            ]
          : [
              { kind: "goal" as const, worth: flat("G", slot) },
              { kind: "assist" as const, worth: flat("A", slot) },
              { kind: "clean sheet" as const, worth: flat("CS", slot) },
              {
                kind: "defensive bonus" as const,
                worth: commonPaid(
                  raws,
                  idsOf((_, name) => /^Defensive Points/u.test(name)),
                  slot,
                  slotOf,
                ),
              },
            ]
        ).filter((w) => w.worth > 0),
      ]),
    ),
  };
  const min = minimums(FANTRAX_LEAGUE_ID);
  const limits = { min: min ?? {}, max: info.roster.maxActiveByPosition };
  const projections = projectionIntel(
    readIntel<IntelProjections>("projections", `${INTEL_SEASON}.json`),
  );
  const strengths = strengthIntel(
    readIntel<IntelStrength>("strength", `${INTEL_SEASON}.json`),
  );
  const rankOf = (measure: "attack" | "defence") =>
    new Map(
      strengthTable(strengths, measure).map((row, at) => [row.code, at + 1]),
    );
  const table = { attack: rankOf("attack"), defence: rankOf("defence") };
  const clubs = new Map(snapshot.clubs.map((c) => [c.id, c]));

  const cutoffs = new Map<Cutoff, MatchupContext[]>();
  for (const [cutoff, last] of [
    ["saturday", saturday],
    ["week", days.at(-1)!],
  ] as const) {
    const upTo = reads.filter((r) => r.date <= last);
    const byMan = new Map<string, { points: number; minutes: number }>();
    for (const { raw } of upTo) {
      for (const p of [
        ...mapLivePlayerPoints(raw),
        ...mapBenchPlayerPoints(raw),
      ].flatMap((squad) => squad.players)) {
        const was = byMan.get(p.fantraxId) ?? { points: 0, minutes: 0 };
        byMan.set(p.fantraxId, {
          points: was.points + p.points,
          minutes: was.minutes + minutesOf(p, minutesCategories),
        });
      }
    }
    const totals = new Map<string, number>();
    for (const { raw } of upTo)
      for (const s of mapLiveScores(raw))
        totals.set(s.teamId, (totals.get(s.teamId) ?? 0) + (s.points ?? 0));

    const draftMan = (m: SheetMan, sheet: Sheet): DraftMan => {
      const games = fixtures.filter(
        (f) =>
          f.homeClubId === m.player.clubId || f.awayClubId === m.player.clubId,
      );
      const done = games.filter((f) => londonDayOf(f.kickoff!)! <= last);
      const coming = games.find((f) => !done.includes(f));
      const home = coming?.homeClubId === m.player.clubId;
      const opponent =
        coming === undefined
          ? undefined
          : clubs.get(home ? coming.awayClubId : coming.homeClubId);
      // A defence faces an attack and an attack a defence, as the sheets' desk reads it.
      const faces =
        opponent === undefined
          ? null
          : standing(
              opponent.code,
              m.slot === "G" || m.slot === "D" ? "attack" : "defence",
              table,
            );
      const got = byMan.get(m.fantraxId);
      const projected =
        projections.get(m.player.code)?.gameweeks.find((g) => g.gw === gameweek)
          ?.points ?? null;
      return {
        fantraxId: m.fantraxId,
        name: m.player.name,
        club: clubs.get(m.player.clubId)?.shortName ?? "?",
        slot: m.slot,
        points: got?.points ?? null,
        minutes: got?.minutes ?? 0,
        played: done.length,
        left: games.length - done.length,
        debut: (debuts(sheet, history.get(sheet.teamId) ?? []) ?? []).some(
          (d) => d.fantraxId === m.fantraxId,
        ),
        projected,
        next:
          opponent === undefined
            ? null
            : `${opponent.name} (${home ? "H" : "A"})${faces === null ? "" : `, ${faces}`}`,
        // Fitness from Fantrax's own news arrives with the writer; until then no man carries any.
        fitness: null,
      };
    };
    const side = (teamId: string): DraftSide | null => {
      const team = facts.teams.find((t) => t.teamId === teamId);
      if (team === undefined) return null;
      const sheet = sheetOf(team);
      const order = orders.get(teamId)?.order ?? [];
      const rank = (m: SheetMan) =>
        order.includes(m.fantraxId) ? order.indexOf(m.fantraxId) : order.length;
      return {
        teamId,
        name: team.teamName,
        total: totals.get(teamId) ?? null,
        eleven: sheet.starters.map((m) => draftMan(m, sheet)),
        bench: [...sheet.bench]
          .sort((a, b) => rank(a) - rank(b))
          .map((m) => draftMan(m, sheet)),
        subOrder: order,
      };
    };
    const place = (teamId: string) => {
      const row = facts.table.find((r) => r.teamId === teamId);
      const run = form.find((f) => f.teamId === teamId)?.run ?? [];
      return row === undefined
        ? null
        : {
            rank: row.rank,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            run: run.map((g) => g.result).join(""),
          };
    };
    const contexts: MatchupContext[] = [];
    for (const pairing of facts.pairings) {
      const home = side(pairing.home.teamId);
      const away = side(pairing.away.teamId);
      if (home === null || away === null) continue;
      contexts.push({
        state: matchupState({ home, away }, worth, limits),
        places: { home: place(home.teamId), away: place(away.teamId) },
        lastMeeting: lastMeeting(info, results, period, home, away),
      });
    }
    cutoffs.set(cutoff, contexts);
  }
  const notes = [
    `Returns by slot: ${SLOTS.map((s) => `${s} ${worth.returns[s].map((w) => `${w.kind} ${w.worth}`).join(", ")}`).join("; ")}; a full match's minutes ${worth.appearance}.`,
    `Eleven limits: most ${JSON.stringify(limits.max)}; fewest ${min === null ? "not recorded for this league" : JSON.stringify(min)}.`,
    `Bench orders: ${[...orders.values()].filter((o) => o.by === "manager").length} of ${orders.size} set by the manager, the rest by total points.`,
  ];
  return { gameweek, period, days, cutoffs, notes };
}

/** The two sides' most recent earlier meeting, in words. */
function lastMeeting(
  info: Parameters<typeof periodPairings>[1] extends infer T
    ? { matchups: Parameters<typeof periodPairings>[0]; teams: T }
    : never,
  results: readonly PeriodResult[],
  period: number,
  home: DraftSide,
  away: DraftSide,
): string | null {
  const scored = (p: number, teamId: string) =>
    results.find((r) => r.period === p && r.teamId === teamId)?.points ?? null;
  for (let p = period - 1; p >= 1; p--) {
    const met = periodPairings(info.matchups, info.teams, p).some(
      (x) =>
        [x.home.teamId, x.away.teamId].sort().join() ===
        [home.teamId, away.teamId].sort().join(),
    );
    if (!met) continue;
    const [h, a] = [scored(p, home.teamId), scored(p, away.teamId)];
    if (h === null || a === null) return null;
    return h === a
      ? `they drew ${h}-${a} in round ${p}`
      : `${h > a ? home.name : away.name} won ${Math.max(h, a)}-${Math.min(h, a)} in round ${p}`;
  }
  return null;
}

/** What Fantrax paid for a full match's minutes this round, the most common payment to a man who played 90: the
 *  league prices minutes in bands the scoring rules do not spell out, so the round's own payments are the reading. */
function appearance(
  raws: readonly Parameters<typeof mapLivePlayerPoints>[0][],
  categories: ReadonlySet<string>,
): number {
  const paid = new Map<number, number>();
  for (const p of raws
    .flatMap((raw) => mapLivePlayerPoints(raw))
    .flatMap((squad) => squad.players)) {
    if (minutesOf(p, categories) < 90) continue;
    const row = p.categories.find((c) => categories.has(c.category));
    if (row !== undefined)
      paid.set(row.points, (paid.get(row.points) ?? 0) + 1);
  }
  return [...paid].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

/** The payment Fantrax most often made in a category to men at one slot this round, above nought; 0 when it made none. */
function commonPaid(
  raws: readonly Parameters<typeof mapLivePlayerPoints>[0][],
  categories: ReadonlySet<string>,
  slot: string,
  slotOf: ReadonlyMap<string, string>,
): number {
  const paid = new Map<number, number>();
  for (const p of raws
    .flatMap((raw) => mapLivePlayerPoints(raw))
    .flatMap((squad) => squad.players)) {
    if (slotOf.get(p.fantraxId) !== slot) continue;
    for (const row of p.categories.filter(
      (c) => categories.has(c.category) && c.points > 0,
    ))
      paid.set(row.points, (paid.get(row.points) ?? 0) + 1);
  }
  return [...paid].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

/** His minutes from Fantrax's own minutes category, which every man who played carries. */
function minutesOf(
  p: LivePlayerPoints,
  categories: ReadonlySet<string>,
): number {
  const row = p.counts.find((c) => categories.has(c.category));
  return row === undefined || row.value === null ? 0 : Number(row.value) || 0;
}
