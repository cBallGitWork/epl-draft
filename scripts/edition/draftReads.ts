import {
  fetchPlFixture,
  fetchPlRound,
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  plFixtureCode,
  plGoals,
  type Fixture,
  type GoalTime,
  type LeagueInfo,
  type LivePlayerPoints,
  type PlGoal,
} from "@epl/core";

// The draft desk's readings of one round's payloads: each goal's minute and club from the PL feed, and each man's
// points and counts, and a full match's pay, from Fantrax's day reads.

type Raw = Parameters<typeof mapLivePlayerPoints>[0];

export interface Tally {
  points: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export type ClubGoal = PlGoal & { clubId: number };

/** Each goal of the gameweek with its minute and the FPL club it counts for, by FPL fixture code. */
export async function goalsByFixture(gameweek: number, fixtures: readonly Fixture[], players: readonly { code: number; optaCode: string | null }[]): Promise<Map<number, ClubGoal[]>> {
  const out = new Map<number, ClubGoal[]>();
  const round = await fetchPlRound(gameweek).catch(() => null);
  if (round === null) return out;
  const optaToCode = new Map(players.flatMap((p) => (p.optaCode === null ? [] : [[p.optaCode, p.code] as const])));
  for (const summary of round.content) {
    const code = plFixtureCode(summary);
    const ours = fixtures.find((f) => f.code === code);
    if (ours === undefined || summary.status === "U") continue;
    const detail = await fetchPlFixture(summary.id).catch(() => null);
    if (detail === null) continue;
    // The detail lists the home side first; a goal counts for the side whose team id it carries, an own goal included.
    const homeTeam = detail.teams[0]?.team.id;
    out.set(ours.code, plGoals(detail, optaToCode).map((g) => ({ ...g, clubId: String(g.teamId) === String(homeTeam) ? ours.homeClubId : ours.awayClubId })));
  }
  return out;
}

export const timeOf = (g: PlGoal): GoalTime => (g.added === undefined ? { minute: g.minute } : { minute: g.minute, added: g.added });

/** Fantrax's category ids for minutes, goals, assists and clean sheets, by their short codes. */
export function categoryIds(info: LeagueInfo): Record<"minutes" | "goals" | "assists" | "cleanSheets", ReadonlySet<string>> {
  const by = (code: string) => new Set(Object.entries(info.scoringCategories).filter(([, c]) => c.code === code).map(([id]) => id));
  return { minutes: by("Min"), goals: by("G"), assists: by("A"), cleanSheets: by("CS") };
}

/** Each man's points and counts over the days read, eleven and bench alike. */
export function tallies(raws: readonly Raw[], ids: ReturnType<typeof categoryIds>): Map<string, Tally> {
  const out = new Map<string, Tally>();
  for (const p of raws.flatMap((raw) => [...mapLivePlayerPoints(raw), ...mapBenchPlayerPoints(raw)]).flatMap((squad) => squad.players)) {
    const was = out.get(p.fantraxId) ?? { points: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0 };
    out.set(p.fantraxId, {
      points: was.points + p.points,
      minutes: was.minutes + countOf(p, ids.minutes),
      goals: was.goals + countOf(p, ids.goals),
      assists: was.assists + countOf(p, ids.assists),
      cleanSheets: was.cleanSheets + countOf(p, ids.cleanSheets),
    });
  }
  return out;
}

/** What Fantrax paid for a full match's minutes this round, the most common payment to a man who played 90: the
 *  league prices minutes in bands the scoring rules do not spell out, so the round's own payments are the reading. */
export function appearance(raws: readonly Raw[], minutes: ReadonlySet<string>): number {
  const paid = new Map<number, number>();
  for (const p of raws.flatMap((raw) => mapLivePlayerPoints(raw)).flatMap((squad) => squad.players)) {
    if (countOf(p, minutes) < 90) continue;
    const row = p.categories.find((c) => minutes.has(c.category));
    if (row !== undefined) paid.set(row.points, (paid.get(row.points) ?? 0) + 1);
  }
  return [...paid].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

/** His count in one of Fantrax's categories, as it states it; nought when it states none. */
function countOf(p: LivePlayerPoints, categories: ReadonlySet<string>): number {
  const row = p.counts.find((c) => categories.has(c.category));
  return row === undefined || row.value === null ? 0 : Number(row.value) || 0;
}
